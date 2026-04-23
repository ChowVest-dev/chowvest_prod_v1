import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Navigation } from "@/components/navigation";
import { DeliveriesWrapper } from "@/components/delivery/deliveries-wrapper";
import { DeliveriesHeader } from "@/components/delivery/deliveries-header";


export const metadata = {
  title: "My Deliveries | Chowvest",
  description: "Track your active and past deliveries",
};

export default async function DeliveriesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }
  // Since this is a mock environment, auto-complete any active deliveries older than 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  await prisma.delivery.updateMany({
    where: {
      userId: session.user.id,
      status: { in: ["PENDING", "CONFIRMED", "PREPARING", "IN_TRANSIT"] },
      createdAt: { lt: fiveMinutesAgo },
    },
    data: {
      status: "DELIVERED",
      deliveredAt: new Date(),
    },
  });

  // Fetch all user deliveries with related basket to get commodity context
  const deliveries = await prisma.delivery.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      basket: {
        select: {
          id: true,
          name: true,
          image: true,
          commodityType: true,
          goalAmount: true,
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform and serialize the payload safely
  const serializedDeliveries = deliveries.map(d => {
    const imageSrc = d.basket?.image || "/rice.jpg";
    const commodityName = d.basket?.name || "Food Items";

    return {
      id: d.id,
      status: d.status,
      address: d.address,
      createdAt: d.createdAt.toISOString(),
      deliveredAt: d.deliveredAt ? d.deliveredAt.toISOString() : null,
      basketId: d.basketId,
      commodityName: commodityName,
      image: imageSrc,
      amount: d.basket?.goalAmount ? Number(d.basket.goalAmount) : 0,
      riderName: d.riderName,
    };
  });

  const readyBasketsRaw = await prisma.basket.findMany({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
      deliveries: {
        none: {
          status: { not: "CANCELLED" }
        }
      }
    }
  });

  const readyBaskets = readyBasketsRaw.map(b => {
    const imageSrc = b.image || "/rice.jpg";
    const commodityName = b.name || "Food Items";
    return {
      id: b.id,
      name: commodityName,
      image: imageSrc,
      goalAmount: Number(b.goalAmount),
    };
  });

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 space-y-6 pt-20 pb-24 md:pb-8 mt-6">
        <DeliveriesHeader />
        <DeliveriesWrapper deliveries={serializedDeliveries} readyBaskets={readyBaskets} />
      </div>
    </>
  );
}
