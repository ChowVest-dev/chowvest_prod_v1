"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { COMMODITIES } from "@/constants/commodities";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CreateGoalCardProps {
  onGoalCreated?: () => void;
}

// Group commodities by category
const groupedCommodities = COMMODITIES.reduce(
  (acc, commodity) => {
    if (!acc[commodity.category]) {
      acc[commodity.category] = [];
    }
    acc[commodity.category].push(commodity);
    return acc;
  },
  {} as Record<string, typeof COMMODITIES>,
);

// Get unique categories
const categories = Object.keys(groupedCommodities);

// Get unique commodity types within a category (by name)
const getCommodityTypes = (category: string) => {
  const commodities = groupedCommodities[category] || [];
  const uniqueTypes = new Map<string, (typeof COMMODITIES)[0]>();

  commodities.forEach((commodity) => {
    if (!uniqueTypes.has(commodity.name)) {
      uniqueTypes.set(commodity.name, commodity);
    }
  });

  return Array.from(uniqueTypes.values());
};

// Get size variants for a specific commodity type
const getSizeVariants = (category: string, commodityName: string) => {
  const commodities = groupedCommodities[category] || [];
  return commodities.filter((c) => c.name === commodityName);
};

type Step = "category" | "type" | "size" | "quantity" | "date" | "review";

interface GoalData {
  category: string;
  commodityType: string;
  selectedCommodity: (typeof COMMODITIES)[0] | null;
  quantity: number;
  targetDate: string;
}

export function CreateGoalCard({ onGoalCreated }: CreateGoalCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("category");
  const [isLoading, setIsLoading] = useState(false);

  const [goalData, setGoalData] = useState<GoalData>({
    category: "",
    commodityType: "",
    selectedCommodity: null,
    quantity: 1,
      targetDate: "",
    });

  const resetModal = () => {
    setCurrentStep("category");
    setGoalData({
      category: "",
      commodityType: "",
      selectedCommodity: null,
      quantity: 1,
      targetDate: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetModal();
    }
  };

  const handleCategorySelect = (category: string) => {
    setGoalData({
      ...goalData,
      category,
      commodityType: "",
      selectedCommodity: null,
    });
    setCurrentStep("type");
  };

  const handleTypeSelect = (commodityName: string) => {
    setGoalData({
      ...goalData,
      commodityType: commodityName,
      selectedCommodity: null,
    });
    setCurrentStep("size");
  };

  const handleSizeSelect = (commodity: (typeof COMMODITIES)[0]) => {
    setGoalData({ ...goalData, selectedCommodity: commodity });
    setCurrentStep("quantity");
  };

  const handleQuantitySelect = () => {
    if (goalData.quantity < 1 || goalData.quantity > 10) {
      toast.error("Quantity must be between 1 and 10");
      return;
    }
    setCurrentStep("date");
  };

  const handleDateSelect = () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 90);
    setGoalData({
      ...goalData,
      targetDate: targetDate.toISOString().split("T")[0],
    });
    setCurrentStep("review");
  };

  const handleBack = () => {
    const stepOrder: Step[] = ["category", "type", "size", "quantity", "date", "review"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalData.selectedCommodity || !goalData.targetDate) {
      toast.error("Please complete all steps");
      return;
    }

    const commodity = goalData.selectedCommodity;

    try {
      setIsLoading(true);

      await axios.post("/api/baskets", {
        name: `${goalData.quantity}x ${commodity.name} (${commodity.size}${commodity.unit})`,
        commodityType: commodity.sku,
        image: commodity.image,
        goalAmount: commodity.price * goalData.quantity,
        targetDate: goalData.targetDate,
        regularTopUp: Math.round((commodity.price * goalData.quantity) / 10),
        description: commodity.description,
      });

      toast.success("Goal created successfully!");
      handleOpenChange(false);

      // Trigger refresh
      if (onGoalCreated) {
        onGoalCreated();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create goal");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "category":
        return "Select Category";
      case "type":
        return "Select Commodity Type";
      case "size":
        return "Select Size";
      case "quantity":
        return "Select Quantity";
      case "date":
        return "Set Target Date";
      case "review":
        return "Review & Confirm";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "category":
        return "Choose the category of commodity you want to save for";
      case "type":
        return "Select the specific type of commodity";
      case "size":
        return "Choose your preferred size";
      case "quantity":
        return "How many units do you want to save for? (Max 10)";
      case "date":
        return "When do you want to reach this goal?";
      case "review":
        return "Review your goal details before creating";
      default:
        return "";
    }
  };

  return (
    <>
      <Card
        data-onboarding-id="create-target-button"
        className="p-6 sticky top-24 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Create New Goal
          </h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Start a new savings goal for your favorite commodities
        </p>

        <Button className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Get Started
        </Button>

        <div className="mt-6 p-4 rounded-lg bg-accent/30">
          <p className="text-xs text-muted-foreground text-center">
            Set your food goals, save steadily, and grow your Chowvest basket.
          </p>
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              {getStepTitle()}
            </DialogTitle>
            <DialogDescription>{getStepDescription()}</DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            {/* Step 1: Category Selection */}
            {currentStep === "category" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card
                    key={category}
                    className={cn(
                      "p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105",
                      goalData.category === category && "ring-2 ring-primary",
                    )}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        <Image
                          src={
                            category === "Rice"
                              ? "/Rice-1.jpg"
                              : category === "Beans"
                                ? "/Bean-3.webp"
                                : "/Garri-2.jpg"
                          }
                          alt={category}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <h3 className="font-semibold text-lg">{category}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {groupedCommodities[category].length} options
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 2: Commodity Type Selection */}
            {currentStep === "type" && goalData.category && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Categories
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getCommodityTypes(goalData.category).map((commodity) => (
                    <Card
                      key={commodity.sku}
                      className={cn(
                        "p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105",
                        goalData.commodityType === commodity.name &&
                          "ring-2 ring-primary",
                      )}
                      onClick={() => handleTypeSelect(commodity.name)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-accent/50 flex items-center justify-center overflow-hidden">
                          {commodity.image ? (
                            <Image
                              src={commodity.image}
                              alt={commodity.name}
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{commodity.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {
                              getSizeVariants(goalData.category, commodity.name)
                                .length
                            }{" "}
                            sizes available
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Size Selection */}
            {currentStep === "size" && goalData.commodityType && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Types
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getSizeVariants(
                    goalData.category,
                    goalData.commodityType,
                  ).map((commodity) => (
                    <Card
                      key={commodity.sku}
                      className={cn(
                        "p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105",
                        goalData.selectedCommodity?.sku === commodity.sku &&
                          "ring-2 ring-primary",
                      )}
                      onClick={() => handleSizeSelect(commodity)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {commodity.size}
                              {commodity.unit}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {commodity.description}
                            </p>
                          </div>
                          {goalData.selectedCommodity?.sku ===
                            commodity.sku && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-lg font-bold text-primary">
                            ₦{commodity.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            
            {/* Step 3.5: Quantity Selection */}
            {currentStep === "quantity" && goalData.selectedCommodity && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Quantity
                </Button>
                <div className="max-w-md mx-auto space-y-6">
                  <div className="space-y-4">
                    <Label className="text-lg">Quantity (Max: 10)</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGoalData({ ...goalData, quantity: Math.max(1, goalData.quantity - 1) })}
                        disabled={goalData.quantity <= 1}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={goalData.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setGoalData({ ...goalData, quantity: Math.min(10, Math.max(1, val)) });
                        }}
                        className="text-center text-lg font-bold"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGoalData({ ...goalData, quantity: Math.min(10, goalData.quantity + 1) })}
                        disabled={goalData.quantity >= 10}
                      >
                        +
                      </Button>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
                      <span className="text-muted-foreground">Total Goal Amount:</span>
                      <span className="text-xl font-bold text-primary">
                        ₦{(goalData.selectedCommodity.price * goalData.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleQuantitySelect}
                  >
                    Continue to Date
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Target Date Selection */}
            {currentStep === "date" && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Quantity
                </Button>
                <div className="max-w-md mx-auto space-y-6">
                  <div className="p-6 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-center text-foreground font-medium leading-relaxed text-[15px]">
                      Start a plan and lock in today's food price for up to 90 days. If prices go up, you pay less. If they go down, you enjoy the lower price.
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleDateSelect}
                  >
                    Continue to Review
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Review & Confirm */}
            {currentStep === "review" && goalData.selectedCommodity && (
              <div className="space-y-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Date
                </Button>

                <Card className="p-6">
                  <div className="flex gap-6">
                    <div className="w-24 h-24 rounded-lg bg-accent/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {goalData.selectedCommodity.image ? (
                        <Image
                          src={goalData.selectedCommodity.image}
                          alt={goalData.selectedCommodity.name}
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-bold">
                          {goalData.selectedCommodity.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {goalData.selectedCommodity.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Category
                          </p>
                          <p className="font-semibold">{goalData.category}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Size</p>
                          <p className="font-semibold">
                            {goalData.quantity}x {goalData.selectedCommodity.size}
                            {goalData.selectedCommodity.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Target Amount
                          </p>
                          <p className="font-semibold text-primary text-lg">
                            ₦{(goalData.selectedCommodity.price * goalData.quantity).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Target Date
                          </p>
                          <p className="font-semibold">
                            {new Date(goalData.targetDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          Suggested Monthly Top-up
                        </p>
                        <p className="font-semibold text-sm">
                          ₦
                          {Math.round(
                            (goalData.selectedCommodity.price * goalData.quantity) / 10,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateGoal}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Goal"}
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
