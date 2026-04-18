import prisma from "@/lib/db";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AlertCircle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { SearchBar } from "@/components/admin/search-bar";

export default async function AdminFinancesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q || "";

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100, // Reasonable cap for active view
    where: query ? {
      OR: [
        { id: { contains: query, mode: "insensitive" } },
        { processorTransactionId: { contains: query, mode: "insensitive" } },
        { user: { email: { contains: query, mode: "insensitive" } } }
      ]
    } : undefined,
    include: {
      user: { select: { fullName: true, email: true } }
    }
  });

  const webhooks = await prisma.processedWebhook.findMany({
    orderBy: { processedAt: "desc" },
    take: 100,
  });

  const flaggedTransactions = transactions.filter(t => t.isFlagged);

  // Reusable transaction table with Variance breakdown
  const renderTransactionTable = (txs: typeof transactions) => (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
          <tr>
            <th className="px-6 py-4 font-medium">Type & Ref</th>
            <th className="px-6 py-4 font-medium">User</th>
            <th className="px-6 py-4 font-medium">Principal</th>
            <th className="px-6 py-4 font-medium">Processing Fee</th>
            <th className="px-6 py-4 font-medium">Paystack Cut</th>
            <th className="px-6 py-4 font-medium text-right">Variance</th>
            <th className="px-6 py-4 font-medium">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {txs.map((tx) => (
            <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {["DEPOSIT", "CREDIT", "REFUND", "TRANSFER_FROM_BASKET"].includes(tx.type) ? (
                    <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">
                      {tx.type === "FEE" ? "DELIVERY FEE" : tx.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">ID: {tx.id.split("-").pop() || tx.id.slice(0, 8)}</span>
                    {tx.processorTransactionId && (
                      <span className="text-[10px] text-muted-foreground font-mono">EXT: {tx.processorTransactionId}</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <Link href={`/admin/users/${tx.userId}`} className="text-primary hover:underline font-medium block">
                  {tx.user?.fullName || "User"}
                </Link>
                <div className="text-xs text-muted-foreground">{tx.user?.email || "Unknown"}</div>
              </td>
              <td className="px-6 py-4 font-mono font-medium">
                {["FEE", "DELIVERY_FEE"].includes(tx.type) && !tx.fee
                  ? `₦${(Number(tx.amount) - 100).toLocaleString()}`
                  : `₦${Number(tx.amount).toLocaleString()}`}
              </td>
              <td className="px-6 py-4 font-mono text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <span>
                    ₦{["FEE", "DELIVERY_FEE"].includes(tx.type) && !tx.fee
                      ? "100"
                      : Number(tx.fee || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-primary/70">
                    {(tx.metadata as any)?.feeType || (tx.type === "DEPOSIT" ? "Processing Fee" : "Service Fee")}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-muted-foreground">
                ₦{Number(tx.processorFee || 0).toLocaleString()}
              </td>
              <td className="px-6 py-4 font-mono font-bold text-right">
                {(() => {
                   let feeVal = Number(tx.fee || 0);
                   if (["FEE", "DELIVERY_FEE"].includes(tx.type) && !tx.fee) feeVal = 100;

                   const variance = feeVal - Number(tx.processorFee || 0);
                   if (variance > 0) return <span className="text-green-600">+₦{variance.toLocaleString()}</span>;
                   if (variance < 0) return <span className="text-red-500">-₦{Math.abs(variance).toLocaleString()}</span>;
                   return <span className="text-muted-foreground">₦0</span>;
                })()}
              </td>
              <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                {new Date(tx.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
          {txs.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground border-dashed border">
                No transactions match criteria.
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
                <BreadcrumbPage>Financial Oversight</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Finances & Webhooks</h1>
            <p className="text-muted-foreground">Monitor platform liquidity and external processor reliability.</p>
          </div>
          <div className="flex items-center gap-4">
            <SearchBar placeholder="Search Ref, Event ID, or Email..." />
            {flaggedTransactions.length > 0 && (
               <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold">
                 <AlertCircle className="w-4 h-4" />
                 {flaggedTransactions.length} Flagged Detected!
               </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="all_tx" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all_tx">All Transactions</TabsTrigger>
            <TabsTrigger value="flagged_tx">Flagged Transactions</TabsTrigger>
            <TabsTrigger value="webhooks">Processed Webhooks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all_tx">
            <Card className="rounded-xl border shadow-sm">
              {renderTransactionTable(transactions)}
            </Card>
          </TabsContent>

          <TabsContent value="flagged_tx">
            <Card className="rounded-xl border shadow-sm">
              {renderTransactionTable(flaggedTransactions)}
            </Card>
          </TabsContent>

          {/* Webhooks Viewer */}
          <TabsContent value="webhooks">
            <Card className="rounded-xl border shadow-sm">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-medium">Event ID (Unique)</th>
                      <th className="px-6 py-4 font-medium">Event Type</th>
                      <th className="px-6 py-4 font-medium">External Reference</th>
                      <th className="px-6 py-4 font-medium">Processed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {webhooks.map((wh) => (
                      <tr key={wh.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{wh.eventId}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="font-mono">{wh.eventType}</Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {wh.reference || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(wh.processedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {webhooks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground border-dashed border">
                          No webhooks have been processed by the system yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
