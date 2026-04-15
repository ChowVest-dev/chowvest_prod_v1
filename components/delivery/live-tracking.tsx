"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Phone, MessageSquare, RefreshCw, Star } from "lucide-react";

interface LiveTrackingProps {
  delivery: any;
  onDeliveryComplete: () => void;
}

type StepKey = "ORDER_READY" | "RIDER_AT_VENDOR" | "IN_TRANSIT" | "ORDER_ARRIVED" | "DELIVERED";

interface TrackingStep {
  key: StepKey;
  label: string;
  description: string;
  delay: number; // ms from start
}

const STEPS: TrackingStep[] = [
  {
    key: "ORDER_READY",
    label: "Order Ready",
    description: "Your order is ready for pickup.",
    delay: 0,
  },
  {
    key: "RIDER_AT_VENDOR",
    label: "Rider At The Vendor",
    description: "Your rider has arrived at the vendor to pick up your order.",
    delay: 45000,
  },
  {
    key: "IN_TRANSIT",
    label: "Order In Transit",
    description: "Your order is on its way.",
    delay: 90000,
  },
  {
    key: "ORDER_ARRIVED",
    label: "Order Arrived",
    description: "Your driver is around to deliver your order.",
    delay: 135000,
  },
  {
    key: "DELIVERED",
    label: "Order Delivered",
    description: "Enjoy your meal, don't forget to rate your meal.",
    delay: 180000,
  },
];

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function LiveTracking({ delivery, onDeliveryComplete }: LiveTrackingProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set(["ORDER_READY"]));
  const [stepTimes, setStepTimes] = useState<Partial<Record<StepKey, Date>>>({
    ORDER_READY: new Date(),
  });

  const totalMinutes = delivery?.deliveryOption === "EXPRESS" ? 18 : 25;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEPS.slice(1).forEach((step) => {
      const t = setTimeout(() => {
        setCompletedSteps((prev) => new Set([...prev, step.key]));
        setStepTimes((prev) => ({ ...prev, [step.key]: new Date() }));

        if (step.key === "DELIVERED") {
          // Update delivery status in DB
          if (delivery?.id) {
            fetch("/api/delivery/status", {
              method: "POST",
              body: JSON.stringify({ deliveryId: delivery.id, status: "DELIVERED" }),
            }).catch(console.error);
          }
          setTimeout(() => onDeliveryComplete(), 1500);
        }
      }, step.delay);

      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [delivery?.id, onDeliveryComplete]);

  const orderId = delivery?.id
    ? delivery.id.substring(delivery.id.length - 6).toUpperCase()
    : "949347";

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            onClick={() => {/* no-op during active delivery */}}
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Order #{orderId}</h1>
        </div>
        <button className="flex items-center gap-1.5 text-[13px] text-primary font-semibold">
          <RefreshCw className="w-3.5 h-3.5" />
          Repeat order
        </button>
      </div>

      {/* Delivery time hero */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-sm text-muted-foreground font-medium mb-0.5">Delivery Time</p>
        <p className="text-4xl font-bold text-foreground">{totalMinutes} mins</p>
      </div>

      {/* Timeline card */}
      <div className="mx-5 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 space-y-0">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.key);
            const isLast = index === STEPS.length - 1;
            const time = stepTimes[step.key];

            return (
              <div key={step.key} className="flex gap-3">
                {/* Left: icon + line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isCompleted
                        ? "bg-primary"
                        : "bg-muted border border-border"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground opacity-40" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 my-1 transition-all duration-700 ${
                        completedSteps.has(STEPS[index + 1]?.key)
                          ? "bg-primary h-10"
                          : "bg-border h-10"
                      }`}
                    />
                  )}
                </div>

                {/* Right: text */}
                <div className={`pb-${isLast ? "0" : "2"} flex-1 pt-0.5 ${!isLast ? "mb-2" : ""}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-[14px] font-semibold transition-colors ${
                        isCompleted ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                    {time && (
                      <span className="text-[12px] text-muted-foreground tabular-nums">
                        {formatTime(time)}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-snug">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rider info */}
      <div className="mx-5 mt-4 bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-lg shrink-0">
          {delivery?.riderName ? delivery.riderName.charAt(0) : "T"}
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-foreground">{delivery?.riderName || "Tunde Bakare"}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[12px] text-muted-foreground">
              {delivery?.riderRating || "4.9"} · {delivery?.deliveryOption === "EXPRESS" ? "Express" : "Standard"} Courier
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors">
            <MessageSquare className="w-4 h-4 text-foreground" />
          </button>
          <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <Phone className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
