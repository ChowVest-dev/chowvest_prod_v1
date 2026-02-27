"use client";

import { Target } from "lucide-react";
import { CreateGoalCard } from "@/components/goals/create-goal-card";
import { GoalsList } from "@/components/goals/goals-list";
import { GoalsHeader } from "@/components/goals/goals-header";
import { COMMODITIES } from "@/constants/commodities";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";

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
  createdAt: string;
}

interface BasketGoalsClientWrapperProps {
  serializedBaskets: Basket[];
  walletBalance: number;
}

export default function BasketGoalsClientWrapper({
  serializedBaskets,
  walletBalance: initialWalletBalance,
}: BasketGoalsClientWrapperProps) {
  const [baskets, setBaskets] = useState<Basket[]>(serializedBaskets);
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeliveriesDialog, setShowDeliveriesDialog] = useState(false);

  const completedBaskets = baskets.filter(
    (b) =>
      b.status === "COMPLETED" ||
      (b.status === "ACTIVE" && b.currentAmount >= b.goalAmount)
  );

  const fetchBaskets = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await axios.get("/api/baskets");
      // Handle the data carefully as API might return strings for Decimals
      const fetchedBaskets = (response.data.baskets || []).map((b: any) => ({
        ...b,
        goalAmount: Number(b.goalAmount),
        currentAmount: Number(b.currentAmount),
        regularTopUp: b.regularTopUp ? Number(b.regularTopUp) : null,
      }));
      setBaskets(fetchedBaskets);
      setWalletBalance(response.data.walletBalance || 0);
    } catch (error) {
      console.error("Error fetching baskets:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBaskets();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchBaskets]);

  // Function to manually refresh (can be called from child components)
  const handleRefresh = useCallback(() => {
    fetchBaskets();
  }, [fetchBaskets]);

  const handleRequestDelivery = async (basketId: string) => {
    try {
      await axios.post(`/api/baskets/${basketId}/request-delivery`);
      toast.success("Delivery request submitted! We'll contact you soon.");
      fetchBaskets();
    } catch (error) {
      console.error(error);
      toast.error("Failed to request delivery");
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 space-y-6 pt-20 pb-24 md:pb-8 mt-6">
      <GoalsHeader
        completedGoalsCount={completedBaskets.length}
        onViewDeliveries={() => setShowDeliveriesDialog(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GoalsList
            baskets={baskets}
            balance={walletBalance}
            onUpdate={handleRefresh}
          />
        </div>
        <div>
          <CreateGoalCard onGoalCreated={handleRefresh} />
        </div>
      </div>

      {/* Deliveries Dialog */}
      <Dialog
        open={showDeliveriesDialog}
        onOpenChange={setShowDeliveriesDialog}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              Ready for Delivery
            </DialogTitle>
            <DialogDescription>
              These goals have reached 100%. Request delivery to receive your
              commodities.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {completedBaskets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No completed goals yet. Keep saving!
              </div>
            ) : (
              completedBaskets.map((basket) => {
                // Resolve commodity details if SKU exists
                const commodity = basket.commodityType
                  ? COMMODITIES.find((c) => c.sku === basket.commodityType)
                  : null;

                const displayName = commodity
                  ? `${commodity.name} (${commodity.size}${commodity.unit})`
                  : basket.name;
                const displayImage =
                  commodity?.image || basket.image || "/placeholder.svg";

                return (
                  <Card key={basket.id} className="p-4">
                    <div className="flex gap-4">
                      <Image
                        src={displayImage}
                        alt={displayName}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {displayName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Completed on{" "}
                              {basket.targetDate
                                ? format(
                                    new Date(basket.targetDate),
                                    "MMM d, yyyy"
                                  )
                                : "No date"}
                            </p>
                          </div>
                          <Badge className="bg-green-500 hover:bg-green-600">
                            100% Complete
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total Saved
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              ₦{basket.currentAmount.toLocaleString()}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              handleRequestDelivery(basket.id);
                              setShowDeliveriesDialog(false);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Request Delivery
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
