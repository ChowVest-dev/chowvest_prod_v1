import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deliveryId, status } = await req.json();

    if (!deliveryId || !status) {
      return NextResponse.json(
        { error: "Delivery ID and status are required" },
        { status: 400 }
      );
    }

    // Verify delivery belongs to user
    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        userId: session.user.id,
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    const updateData: any = { status };
    
    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    return NextResponse.json(
      { delivery: updatedDelivery, success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update delivery status error:", error);
    return NextResponse.json(
      { error: "Failed to update delivery status" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const deliveryId = searchParams.get("deliveryId");

  if (!deliveryId) {
    return new Response("Delivery ID is required", { status: 400 });
  }

  // Verify delivery belongs to user
  const initialDelivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      userId: session.user.id,
    },
  });

  if (!initialDelivery) {
    return new Response("Delivery not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isConnected = true;

      req.signal.addEventListener("abort", () => {
        isConnected = false;
      });

      // Send initial state
      try {
        const data = JSON.stringify(initialDelivery);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      } catch (e) {
        console.error("SSE initial emit error", e);
      }

      while (isConnected) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        if (!isConnected) break;

        try {
          const latestDelivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
          });

          if (latestDelivery) {
            const data = JSON.stringify(latestDelivery);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        } catch (error) {
          console.error("SSE stream polling error:", error);
        }
      }
      
      try {
        controller.close();
      } catch (e) {}
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
