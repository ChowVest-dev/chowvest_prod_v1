import prisma from "@/lib/db";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { SuspendUserButton, ForceLogoutButton, CreditWalletButton } from "../client-components";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    include: {
      wallet: true,
      sessions: {
        orderBy: { lastUsedAt: "desc" }
      },
      baskets: true,
    }
  });

  if (!user) return notFound();

  // Fetch recent transactions if wallet exists
  let transactions: any[] = [];
  if (user.wallet) {
    transactions = await prisma.transaction.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/users">Users</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{user.fullName || "User Detail"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.fullName || "Unnamed User"}</h1>
            <p className="text-muted-foreground">{user.email} • Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SuspendUserButton userId={user.id} isSuspended={user.accountStatus === "suspended"} />
            <ForceLogoutButton userId={user.id} />
          </div>
        </div>

        {user.accountStatus === "suspended" && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
            ⚠️ This account is currently suspended. Reason: {user.suspensionReason || "N/A"}. Suspended on: {user.suspendedAt ? new Date(user.suspendedAt).toLocaleDateString() : "Unknown"}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Identity & KYC Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identity & KYC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Email Status</span>
                {user.emailVerified ? <Badge>Verified</Badge> : <Badge variant="outline">Unverified</Badge>}
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{user.phoneNumber || "Not provided"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{user.location || "Not provided"}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground">Onboarding</span>
                {user.hasCompletedOnboarding ? <Badge variant="secondary">Completed</Badge> : <Badge variant="outline">Pending</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Wallet Control Card */}
          <Card className="lg:col-span-2 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                Wallet Control panel
              </CardTitle>
              {user.wallet && (
                <CreditWalletButton userId={user.id} disabled={user.wallet.status === "frozen"} />
              )}
            </CardHeader>
            <CardContent>
              {!user.wallet ? (
                <div className="text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                  User has not initialized their wallet yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Current Balance</div>
                    <div className="text-2xl font-bold text-primary">₦{Number(user.wallet.balance).toLocaleString()}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Total Deposits</div>
                    <div className="text-xl font-bold">₦{Number(user.wallet.totalDeposits).toLocaleString()}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Total Spent</div>
                    <div className="text-xl font-bold">₦{Number(user.wallet.totalSpent).toLocaleString()}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Status</div>
                    <div>
                      {user.wallet.status === "frozen" ? (
                        <Badge variant="destructive">Frozen</Badge>
                      ) : (
                        <Badge className="bg-green-600">Active</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transactions specific to this user */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Wallet Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                No transactions recorded yet.
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Flagged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-4 py-3 font-semibold">{tx.type}</td>
                        <td className={`px-4 py-3 font-mono font-bold ${tx.type === "DEPOSIT" ? "text-green-600" : "text-red-500"}`}>
                          {tx.type === "DEPOSIT" ? "+" : "-"}₦{Number(tx.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{tx.description}</td>
                        <td className="px-4 py-3">
                          <Badge variant={tx.status === "COMPLETED" ? "secondary" : "default"}>{tx.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {tx.isFlagged ? <Badge variant="destructive">Flagged</Badge> : <span className="text-muted-foreground">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </>
  );
}
