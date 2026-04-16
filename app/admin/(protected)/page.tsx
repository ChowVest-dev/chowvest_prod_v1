import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import prisma from "@/lib/db"

export default async function AdminDashboardPage() {
  const [totalUsers, activeDeliveries, totalWalletBalanceData] = await Promise.all([
    prisma.user.count(),
    prisma.delivery.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "IN_TRANSIT"] } }
    }),
    prisma.wallet.aggregate({
      _sum: {
        balance: true
      }
    })
  ]);

  const totalWalletBalance = Number(totalWalletBalanceData._sum.balance || 0);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
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
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">High-level metrics for the Chowvest platform.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Users</h3>
            <div className="mt-2 text-3xl font-bold">{totalUsers}</div>
          </div>
          
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Active Deliveries</h3>
            <div className="mt-2 text-3xl font-bold">{activeDeliveries}</div>
          </div>
          
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Wallet Volume</h3>
            <div className="mt-2 text-3xl font-bold">₦{totalWalletBalance.toLocaleString()}</div>
          </div>
        </div>

        <div className="min-h-[400px] flex-1 rounded-xl bg-muted/30 border border-border mt-4 flex items-center justify-center text-muted-foreground">
          Detailed metrics charts pending...
        </div>
      </div>
    </>
  )
}
