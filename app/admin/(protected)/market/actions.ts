"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateCommodityPrice(commodityId: string, newPrice: number) {
  if (isNaN(newPrice) || newPrice <= 0) throw new Error("Invalid price");

  await prisma.commodity.update({
    where: { id: commodityId },
    data: { price: newPrice, updatedAt: new Date() },
  });
  revalidatePath("/admin/market");
}

export async function toggleCommodityStatus(commodityId: string, isActive: boolean) {
  await prisma.commodity.update({
    where: { id: commodityId },
    data: { isActive, updatedAt: new Date() },
  });
  revalidatePath("/admin/market");
}

export async function createCommodity(data: {
  name: string;
  sku: string;
  category: string;
  brand?: string;
  price: number;
  unit: string;
  size: number;
  description?: string;
}) {
  if (!data.name || !data.sku || !data.category || !data.unit || data.price <= 0 || data.size <= 0) {
    throw new Error("All required fields must be valid.");
  }
  await prisma.commodity.create({
    data: {
      name: data.name,
      sku: data.sku.toUpperCase(),
      category: data.category,
      brand: data.brand || null,
      price: data.price,
      unit: data.unit,
      size: data.size,
      description: data.description || null,
      isActive: true,
    },
  });
  revalidatePath("/admin/market");
}

export async function updatePlatformConfig(key: string, value: string) {
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue < 0) throw new Error("Value must be a non-negative number");

  await prisma.platformConfig.upsert({
    where: { key },
    update: { value: String(numValue) },
    create: { key, value: String(numValue), label: key },
  });
  revalidatePath("/admin/market");
}
