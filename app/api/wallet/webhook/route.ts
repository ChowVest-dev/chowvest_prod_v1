import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { koboToNaira } from "@/lib/payment";
import prisma from "@/lib/db";
import { logFinancialAction } from "@/lib/audit";
import { sendTransactionNotification } from "@/lib/notifications/create";
import { Prisma } from "@/lib/generated/prisma/client";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

/**
 * Verify that the webhook actually came from Paystack by validating
 * the x-paystack-signature header against the request body.
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headersList = await headers();
    const signature = headersList.get("x-paystack-signature") ?? "";

    // Always verify the signature first
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("Paystack webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // We only care about successful charges
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const eventId = event.data?.id?.toString();
    const { reference, amount: amountKobo, fees } = event.data;

    if (!reference) {
      return NextResponse.json({ error: "No reference" }, { status: 400 });
    }

    // ── Idempotency Guard ──
    // Use a DB unique constraint on eventId to prevent duplicate processing.
    // If two identical webhooks arrive simultaneously, only one will succeed
    // at inserting into ProcessedWebhook; the other will hit the unique
    // constraint and be safely rejected.
    if (eventId) {
      try {
        await prisma.processedWebhook.create({
          data: {
            eventId,
            eventType: event.event,
            reference,
            payload: event.data,
          },
        });
      } catch (error: any) {
        // P2002 = Unique constraint violation → already processed
        if (error?.code === "P2002") {
          console.log(`Paystack webhook: duplicate event ${eventId}, skipping`);
          return NextResponse.json({ received: true, message: "Already processed" });
        }
        throw error;
      }
    }

    // Find the corresponding pending transaction
    const transaction = await prisma.transaction.findUnique({
      where: { processorTransactionId: reference },
      include: { wallet: true },
    });

    if (!transaction) {
      // Transaction not found – could be a different reference format, ignore
      console.warn(`Paystack webhook: transaction not found for ref ${reference}`);
      // Return 200 so Paystack doesn't retry indefinitely
      return NextResponse.json({ received: true });
    }

    // Secondary check: skip if already completed (belt-and-suspenders)
    if (transaction.status === "COMPLETED") {
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    const amount = koboToNaira(amountKobo);
    const fee = koboToNaira(fees ?? 0);
    const netAmount = amount - fee;

    const amountDecimal = new Prisma.Decimal(amount);
    const feeDecimal = new Prisma.Decimal(fee);
    const netAmountDecimal = new Prisma.Decimal(netAmount);

    // Credit the wallet atomically
    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: { increment: netAmountDecimal },
          totalDeposits: { increment: amountDecimal },
        },
      });

      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          amount: amountDecimal,
          fee: feeDecimal,
          netAmount: netAmountDecimal,
          balanceAfter: updatedWallet.balance,
          completedAt: new Date(),
          processorFee: feeDecimal,
          processorResponse: event.data,
        },
      });

      return { wallet: updatedWallet, transaction: updatedTransaction };
    });

    await logFinancialAction(
      transaction.userId,
      "deposit_completed",
      `Deposit of ₦${amountDecimal.toFixed(2)} completed via Paystack webhook`,
      {
        amount: amountDecimal.toString(),
        fee: feeDecimal.toString(),
        netAmount: netAmountDecimal.toString(),
        reference,
        newBalance: result.wallet.balance.toString(),
        source: "webhook",
      }
    );

    await sendTransactionNotification(
      transaction.userId,
      "DEPOSIT",
      netAmountDecimal.toNumber(),
      "COMPLETED"
    );

    console.log(`Paystack webhook: credited ₦${netAmount} to wallet ${transaction.walletId}`);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Paystack webhook error:", error);
    // Return 200 to prevent Paystack from retrying on our internal errors
    return NextResponse.json({ received: true });
  }
}
