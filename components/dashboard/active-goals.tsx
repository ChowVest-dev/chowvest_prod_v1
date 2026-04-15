"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { COMMODITIES } from "@/constants/commodities";
import { useRouter } from "next/navigation";

interface Basket {
  name: string;
  goalAmount: number;
  currentAmount: number;
  image: string | null;
  commodityType: string | null;
  category: string;
}

interface ActiveGoalsProps {
  baskets: Basket[];
}

export function ActiveGoals({ baskets }: ActiveGoalsProps) {
  const router = useRouter();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            Your Baskets
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Items you're securing for your kitchen.
          </p>
        </div>
        <Button
          onClick={() => router.push("/basket-goals")}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Start New Basket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {baskets.map((goal) => {
          const progress = (goal.currentAmount / goal.goalAmount) * 100;

          // Resolve commodity details if SKU exists
          const commodity = goal.commodityType
            ? COMMODITIES.find((c) => c.sku === goal.commodityType)
            : null;

          const displayName = commodity
            ? `${commodity.name} (${commodity.size}${commodity.unit})`
            : goal.name;
          const displayImage =
            commodity?.image || goal.image || "/placeholder.svg";

          return (
            <Card key={goal.name} className="p-4 bg-accent/30 border-border/50">
              <div className="flex gap-4">
                <img
                  src={displayImage}
                  alt={displayName}
                  className="w-20 h-20 rounded-lg object-cover bg-muted"
                />
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-foreground">
                    {displayName}
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">
                        ₦{goal.currentAmount.toLocaleString()} / ₦
                        {goal.goalAmount.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-primary font-medium">
                      {progress.toFixed(0)}% secured
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
