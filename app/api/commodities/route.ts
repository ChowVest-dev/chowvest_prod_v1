import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // Optional: "SAVINGS" | "MARKETPLACE" | "BOTH"

    const whereClause: any = { isActive: true };
    
    if (type && ["SAVINGS", "MARKETPLACE"].includes(type)) {
      whereClause.OR = [
        { marketType: type },
        { marketType: "BOTH" }
      ];
    } else if (type === "BOTH") {
      whereClause.marketType = "BOTH";
    }

    const commodities = await prisma.commodity.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
        { size: 'asc' }
      ]
    });

    return NextResponse.json(commodities);
  } catch (error) {
    console.error("Failed to fetch commodities:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities" },
      { status: 500 }
    );
  }
}
