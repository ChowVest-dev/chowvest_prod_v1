"use server";

import prisma from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";

export async function updateDeliveryStatus(deliveryId: string, newStatus: string) {
  await requireAdminSession();

  const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error("Invalid delivery status");
  }

  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new Error("Delivery not found");

  // Track relevant timestamps
  const updates: any = { status: newStatus };
  const now = new Date();
  
  if (newStatus === "CONFIRMED" && !delivery.confirmedAt) updates.confirmedAt = now;
  if (newStatus === "PREPARING" && !delivery.preparingAt) updates.preparingAt = now;
  if (newStatus === "IN_TRANSIT" && !delivery.dispatchedAt) updates.dispatchedAt = now;
  if (newStatus === "DELIVERED" && !delivery.deliveredAt) updates.deliveredAt = now;

  // Execute update alongside an automated user notification
  await prisma.$transaction([
    prisma.delivery.update({
      where: { id: deliveryId },
      data: updates
    }),
    prisma.notification.create({
      data: {
        userId: delivery.userId,
        type: "delivery_update",
        title: "Delivery Status Update",
        message: `Your food delivery is now: ${newStatus.replace("_", " ")}.`,
        link: `/dashboard` // Send them to dashboard track active deliveries
      }
    })
  ]);

  revalidatePath(`/admin/deliveries`);
  revalidatePath(`/admin/deliveries/${deliveryId}`);
  return { success: true, status: newStatus };
}
