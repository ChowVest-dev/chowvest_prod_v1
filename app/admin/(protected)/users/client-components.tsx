"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleUserSuspension, forceLogoutUser, creditUserWallet } from "./actions";
import { ShieldBan, LogOut, CheckCircle2, Wallet, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is installed, if not we'll handle gracefully

export function SuspendUserButton({ userId, isSuspended }: { userId: string, isSuspended: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const res = await toggleUserSuspension(userId);
        if (res.success) {
          toast(`User ${res.status === "suspended" ? "Suspended" : "Re-activated"}`);
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to update status");
      }
    });
  };

  return (
    <Button 
      variant={isSuspended ? "outline" : "destructive"} 
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
        (isSuspended ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <ShieldBan className="mr-2 h-4 w-4" />)}
      {isSuspended ? "Unsuspend User" : "Suspend User"}
    </Button>
  );
}

export function ForceLogoutButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await forceLogoutUser(userId);
        toast("Revoked all active sessions for user.");
      } catch (e: any) {
        toast.error(e.message || "Failed to force logout");
      }
    });
  };

  return (
    <Button variant="secondary" onClick={handleLogout} disabled={isPending}>
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
      Force Logout
    </Button>
  );
}

export function CreditWalletButton({ userId, disabled }: { userId: string, disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleCredit = () => {
    const amountStr = prompt("Enter amount to credit (₦):", "5000");
    if (!amountStr) return;
    
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    startTransition(async () => {
      try {
        await creditUserWallet(userId, amount);
        toast.success(`Successfully credited ₦${amount.toLocaleString()}`);
      } catch (e: any) {
        toast.error(e.message || "Failed to credit wallet");
      }
    });
  };

  return (
    <Button onClick={handleCredit} disabled={isPending || disabled} className="bg-green-600 hover:bg-green-700 text-white">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
      Credit ₦5,000 (Manual)
    </Button>
  );
}
