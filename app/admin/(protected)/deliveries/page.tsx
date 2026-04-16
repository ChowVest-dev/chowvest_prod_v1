import prisma from "@/lib/db";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DeliveryStatusChanger } from "./client-components";

import { SearchBar } from "@/components/admin/search-bar";

export default async function AdminDeliveriesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q || "";

  const deliveries = await prisma.delivery.findMany({
    orderBy: { requestedAt: "desc" },
    where: query ? {
      OR: [
        { id: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
        { riderName: { contains: query, mode: "insensitive" } }
      ]
    } : undefined,
    include: {
      basket: { select: { name: true, image: true, commodityType: true } }
    }
  });

  const activeDeliveries = deliveries.filter(d => ["PENDING", "CONFIRMED", "PREPARING", "IN_TRANSIT"].includes(d.status));
  const historicalDeliveries = deliveries.filter(d => ["DELIVERED", "CANCELLED"].includes(d.status));

  const DeliveryTable = ({ data }: { data: typeof deliveries }) => (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
          <tr>
            <th className="px-6 py-4 font-medium">Order ID</th>
            <th className="px-6 py-4 font-medium">Commodity</th>
            <th className="px-6 py-4 font-medium">Address</th>
            <th className="px-6 py-4 font-medium">Status Control</th>
            <th className="px-6 py-4 font-medium">Requested</th>
            <th className="px-6 py-4 font-medium text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((delivery) => (
            <tr key={delivery.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-6 py-4">
                <div className="font-mono text-xs text-muted-foreground mb-1">
                  {delivery.id.split("-").pop() || delivery.id.slice(0, 8)}
                </div>
                <div className="font-semibold">{delivery.deliveryOption}</div>
              </td>
              <td className="px-6 py-4 font-medium text-foreground">
                {delivery.basket?.name || "Food Items"}
              </td>
              <td className="px-6 py-4 max-w-[200px] truncate" title={delivery.address}>
                <div className="font-medium text-xs mb-1">{delivery.addressLabel || "Address"}</div>
                {delivery.address}
              </td>
              <td className="px-6 py-4">
                <DeliveryStatusChanger deliveryId={delivery.id} currentStatus={delivery.status} />
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                {new Date(delivery.requestedAt).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-right">
                <Link 
                  href={`/admin/deliveries/${delivery.id}`} 
                  className="text-primary font-medium hover:underline text-sm"
                >
                  View Details →
                </Link>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground border-dashed border">
                No deliveries in this queue.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Delivery Operations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Delivery Operations</h1>
            <p className="text-muted-foreground">Monitor and update the fulfillment pipeline.</p>
          </div>
          <div className="flex items-center gap-4">
            <SearchBar placeholder="Search ID, Address, or Rider..." />
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
              {activeDeliveries.length} Active
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Queue</TabsTrigger>
            <TabsTrigger value="history">Historical Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Card className="rounded-xl border shadow-sm">
              <DeliveryTable data={activeDeliveries} />
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="rounded-xl border shadow-sm">
              <DeliveryTable data={historicalDeliveries} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
