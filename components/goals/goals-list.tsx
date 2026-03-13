"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { COMMODITIES } from "@/constants/commodities";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface Basket {
  id: string;
  name: string;
  commodityType: string | null;
  image: string | null;
  goalAmount: number;
  currentAmount: number;
  description: string | null;
  targetDate: string | null;
  regularTopUp: number | null;
  category: string;
  status: string;
}

interface GoalsListProps {
  baskets: Basket[];
  balance?: number;
  onUpdate?: () => void;
}

export function GoalsList({ baskets, balance, onUpdate }: GoalsListProps) {
  const [selectedBasket, setSelectedBasket] = useState<string | null>(null);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activeBaskets = baskets.filter((b: any) => b.status === "ACTIVE");

  const handleAddFunds = (basketId: string) => {
    setSelectedBasket(basketId);
    setAddFundsOpen(true);
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      setIsLoading(true);
      await axios.delete(`/api/baskets/${goalToDelete}`);
      toast.success("Goal deleted successfully");

      if (onUpdate) {
        onUpdate();
      }
      setGoalToDelete(null);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Failed to delete goal";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDelivery = async (basketId: string) => {
    try {
      setIsLoading(true);

      await axios.post(`/api/baskets/${basketId}/request-delivery`);

      toast.success("Delivery request submitted! We'll contact you soon.");

      // Trigger refresh
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to request delivery");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAddFunds = async () => {
    if (!selectedBasket || !amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const availableBalance = balance || 0;
    if (parseFloat(amount) > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setIsLoading(true);

      await axios.post(`/api/baskets/${selectedBasket}/add-funds`, {
        amount: parseFloat(amount),
      });

      toast.success("Funds added successfully!");
      setAddFundsOpen(false);
      setAmount("");
      setSelectedBasket(null);

      // Trigger refresh
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add funds");
    } finally {
      setIsLoading(false);
    }
  };

  if (activeBaskets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <Plus className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first food goal to start saving
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {activeBaskets.map((goal, i) => {
          const progress = (goal.currentAmount / goal.goalAmount) * 100;
          const remaining = goal.goalAmount - goal.currentAmount;

          // Resolve commodity details if SKU exists
          const commodity = goal.commodityType
            ? COMMODITIES.find((c) => c.sku === goal.commodityType)
            : null;

          const displayName = commodity
            ? `${commodity.name} (${commodity.size}${commodity.unit})`
            : goal.name;
          const displayImage =
            commodity?.image || goal.image || "/placeholder.svg";
          const displayCategory = commodity?.category || goal.category;

          return (
            <Card
              key={goal.id}
              data-onboarding-id={i === 0 ? "goal-progress-bar" : undefined}
              className={`p-6 hover:shadow-lg transition-shadow ${
                progress >= 100 ? "border-green-500 border-2" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative">
                  <Image
                    src={displayImage}
                    alt={displayName}
                    width={100}
                    height={100}
                    className="w-full md:w-32 h-32 rounded-xl object-cover bg-muted"
                  />
                  {progress >= 100 && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-foreground">
                          {displayName}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {displayCategory}
                        </Badge>
                        {progress >= 100 && (
                          <Badge className="text-xs bg-green-500 hover:bg-green-600">
                            Goal Reached!
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Target by{" "}
                        {goal.targetDate
                          ? format(new Date(goal.targetDate), "MMM d, yyyy")
                          : "No deadline"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          onClick={() => setGoalToDelete(goal.id)}
                        >
                          Delete Goal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">
                        ₦{goal.currentAmount.toLocaleString()} saved
                      </span>
                      <span className="text-muted-foreground">
                        ₦{remaining.toLocaleString()} remaining
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Regular Top-Up
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        ₦{goal.regularTopUp?.toLocaleString() || "0"}
                      </p>
                    </div>
                    {progress >= 100 ? (
                      <Button
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => handleRequestDelivery(goal.id)}
                      >
                        Request Delivery
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => handleAddFunds(goal.id)}
                      >
                        <Plus className="w-4 h-4" />
                        Add Funds
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!goalToDelete}
        onOpenChange={(open) => !open && setGoalToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this goal? This action cannot be
              undone.
              {/* Note: In our API, we only allow deleting if funds are 0, so no fear of losing money here, but good to be explicit */}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setGoalToDelete(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGoal}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Goal</DialogTitle>
            <DialogDescription>
              Transfer funds from your wallet to this goal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₦
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[5000, 10000, 20000].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(amt.toString())}
                  disabled={isLoading}
                >
                  ₦{amt / 1000}k
                </Button>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                Available balance:{" "}
                <span className="font-semibold text-foreground">
                  ₦{(balance || 0).toLocaleString()}
                </span>
              </p>
            </div>

            <Button
              onClick={confirmAddFunds}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Add Funds"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
