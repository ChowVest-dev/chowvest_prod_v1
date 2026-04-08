import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { logAction } from "@/lib/audit";
import { COMMODITIES } from "@/constants/commodities";
import { sendDeliveryStatusEmail } from "@/lib/email-delivery";
import {
  sendDeliveryRequestNotification,
  sendDeliveryStatusNotification,
} from "@/lib/notifications/delivery";

const DELIVERY_FEES: Record<string, number> = {
  EXPRESS: 1200,
  STANDARD: 700,
  SCHEDULED: 500,
};

const SERVICE_FEE = 100;

// Simulated rider pool
const RIDERS = [
  { name: "Adebayo Kareem", phone: "0801-234-5678", rating: 4.9 },
  { name: "Chinedu Okafor", phone: "0802-345-6789", rating: 4.8 },
  { name: "Musa Ibrahim", phone: "0803-456-7890", rating: 4.7 },
  { name: "Tunde Bakare", phone: "0804-567-8901", rating: 4.9 },
  { name: "Emeka Nwosu", phone: "0805-678-9012", rating: 4.6 },
];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      basketId,
      address,
      addressLabel,
      deliveryNote,
      deliveryOption = "STANDARD",
    } = body;

    if (!basketId || !address) {
      return NextResponse.json(
        { error: "Basket ID and delivery address are required" },
        { status: 400 }
      );
    }

    if (!["EXPRESS", "STANDARD", "SCHEDULED"].includes(deliveryOption)) {
      return NextResponse.json(
        { error: "Invalid delivery option" },
        { status: 400 }
      );
    }

    // Verify basket belongs to user and is complete
    const basket = await prisma.basket.findFirst({
      where: {
        id: basketId,
        userId: session.user.id,
      },
    });

    if (!basket) {
      return NextResponse.json(
        { error: "Basket not found" },
        { status: 404 }
      );
    }

    const currentAmount = Number(basket.currentAmount);
    const goalAmount = Number(basket.goalAmount);

    if (currentAmount < goalAmount) {
      return NextResponse.json(
        { error: "Savings goal has not been reached yet" },
        { status: 400 }
      );
    }

    // Check for existing pending delivery
    const existingDelivery = await prisma.delivery.findFirst({
      where: {
        basketId,
        userId: session.user.id,
        status: { in: ["PENDING", "CONFIRMED", "PREPARING", "IN_TRANSIT"] },
      },
    });

    if (existingDelivery) {
      return NextResponse.json(
        { error: "A delivery is already in progress for this basket" },
        { status: 400 }
      );
    }

    const deliveryFee = DELIVERY_FEES[deliveryOption] || 700;
    const totalFee = new Prisma.Decimal(deliveryFee + SERVICE_FEE);
    
    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }
    
    if (wallet.balance.lessThan(totalFee)) {
      return NextResponse.json(
        { error: "Insufficient wallet balance for delivery fees" },
        { status: 400 }
      );
    }

    // Simulate rider assignment
    const rider = RIDERS[Math.floor(Math.random() * RIDERS.length)];

    // Calculate estimated delivery time
    const now = new Date();
    let estimatedMinutes = 60;
    if (deliveryOption === "EXPRESS") estimatedMinutes = 40;
    if (deliveryOption === "SCHEDULED") estimatedMinutes = 180;
    const estimatedAt = new Date(now.getTime() + estimatedMinutes * 60000);

    const delivery = await prisma.$transaction(async (tx) => {
      // Create delivery
      const newDelivery = await tx.delivery.create({
        data: {
          userId: session.user.id,
          deliveryType: "BASKET",
          orderId: basket.id,
          basketId: basket.id,
          status: "CONFIRMED",
          address,
          addressLabel: addressLabel || null,
          deliveryNote: deliveryNote || null,
          deliveryOption,
          deliveryFee,
          serviceFee: SERVICE_FEE,
          riderName: rider.name,
          riderPhone: rider.phone,
          riderRating: rider.rating,
          estimatedAt,
          confirmedAt: now,
        },
      });

      // Update basket status to COMPLETED
      await tx.basket.update({
        where: { id: basketId },
        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      });

      // Deduct fee from wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalFee } }
      });

      // Create fee transaction log
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          walletId: wallet.id,
          basketId: basket.id,
          type: "FEE",
          amount: totalFee,
          netAmount: totalFee,
          description: `Delivery and Service Fee for ${basket.name}`,
          status: "COMPLETED",
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          completedAt: now,
        }
      });

      return newDelivery;
    });

    // Get commodity info for notifications
    const commodity = basket.commodityType
      ? COMMODITIES.find((c) => c.sku === basket.commodityType)
      : null;
    const itemName = commodity
      ? `${commodity.name} (${commodity.size}${commodity.unit})`
      : basket.name;

    // Send notification
    await sendDeliveryRequestNotification(
      session.user.id,
      itemName,
      address
    );

    // Send confirmation email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, fullName: true },
    });

    if (user) {
      await sendDeliveryStatusEmail({
        email: user.email,
        name: user.fullName,
        orderId: delivery.id,
        status: "CONFIRMED",
        address,
        deliveryOption,
        itemName,
        totalAmount: goalAmount + deliveryFee + SERVICE_FEE,
        deliveryFee,
        riderName: rider.name,
        riderPhone: rider.phone,
        estimatedTime: estimatedAt.toLocaleTimeString("en-NG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    await logAction({
      userId: session.user.id,
      action: "delivery_requested",
      category: "financial",
      description: `Delivery requested for basket: ${basket.name}`,
      metadata: {
        deliveryId: delivery.id,
        basketId,
        deliveryOption,
        deliveryFee,
        address,
      },
    });

    return NextResponse.json(
      {
        delivery: {
          ...delivery,
          deliveryFee: Number(delivery.deliveryFee),
          serviceFee: Number(delivery.serviceFee),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create delivery error:", error);
    return NextResponse.json(
      { error: "Failed to create delivery" },
      { status: 500 }
    );
  }
}
