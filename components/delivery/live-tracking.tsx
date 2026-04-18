"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Phone, MessageSquare, RefreshCw, Star } from "lucide-react";
import Link from "next/link";

interface LiveTrackingProps {
  delivery: any;
  onDeliveryComplete: () => void;
}

type StepKey = "PENDING" | "CONFIRMED" | "PREPARING" | "IN_TRANSIT" | "DELIVERED";

interface TrackingStep {
  key: StepKey;
  label: string;
  description: string;
}

const STEPS: TrackingStep[] = [
  {
    key: "PENDING",
    label: "Order Received",
    description: "Your order has been received.",
  },
  {
    key: "CONFIRMED",
    label: "Order Confirmed",
    description: "Your order is confirmed and ready to be prepared.",
  },
  {
    key: "PREPARING",
    label: "Preparing Your Order",
    description: "The vendor is preparing your order.",
  },
  {
    key: "IN_TRANSIT",
    label: "Order In Transit",
    description: "Your order is on its way.",
  },
  {
    key: "DELIVERED",
    label: "Order Delivered",
    description: "Enjoy your meal, don't forget to rate your meal.",
  },
];

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function LiveTracking({ delivery, onDeliveryComplete }: LiveTrackingProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set(["PENDING"]));
  const [stepTimes, setStepTimes] = useState<Partial<Record<StepKey, Date>>>({});
  const completeTriggeredRef = useRef(false);

  const totalMinutes = delivery?.deliveryOption === "EXPRESS" ? 18 : 25;

  useEffect(() => {
    if (!delivery?.id) return;

    const eventSource = new EventSource(`/api/delivery/status?deliveryId=${delivery.id}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        const newCompleted = new Set<StepKey>();
        const newTimes: Partial<Record<StepKey, Date>> = {};

        if (data.requestedAt) {
          newCompleted.add("PENDING");
          newTimes.PENDING = new Date(data.requestedAt);
        }
        if (data.confirmedAt) {
          newCompleted.add("CONFIRMED");
          newTimes.CONFIRMED = new Date(data.confirmedAt);
        }
        if (data.preparingAt) {
          newCompleted.add("PREPARING");
          newTimes.PREPARING = new Date(data.preparingAt);
        }
        if (data.dispatchedAt) {
          newCompleted.add("IN_TRANSIT");
          newTimes.IN_TRANSIT = new Date(data.dispatchedAt);
        }
        if (data.deliveredAt) {
          newCompleted.add("DELIVERED");
          newTimes.DELIVERED = new Date(data.deliveredAt);
        }

        setCompletedSteps(newCompleted);
        setStepTimes(newTimes);

        if (data.status === "DELIVERED" && !completeTriggeredRef.current) {
          completeTriggeredRef.current = true;
          setTimeout(() => onDeliveryComplete(), 1500);
        }
      } catch (error) {
        console.error("Failed to parse SSE data", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
    };

    return () => {
      eventSource.close();
    };
  }, [delivery?.id, onDeliveryComplete]);

  const orderId = delivery?.id
    ? delivery.id.substring(delivery.id.length - 6).toUpperCase()
    : "949347";

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <button
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            onClick={() => {/* no-op during active delivery */}}
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Order #{orderId}</h1>
        </Link>
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
