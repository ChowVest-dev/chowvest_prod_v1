"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryStatusChanger } from "./client-components";

const KANBAN_STATUSES = [
  { key: "PENDING",    label: "Pending",    color: "border-yellow-400 bg-yellow-400/5" },
  { key: "CONFIRMED",  label: "Confirmed",  color: "border-blue-400 bg-blue-400/5" },
  { key: "PREPARING",  label: "Preparing",  color: "border-purple-400 bg-purple-400/5" },
  { key: "IN_TRANSIT", label: "In Transit", color: "border-orange-400 bg-orange-400/5" },
];

interface Delivery {
  id: string;
  status: string;
  deliveryOption: string;
  address: string;
  addressLabel: string | null;
  requestedAt: Date;
  basket: { name: string; commodityType: string | null } | null;
}

export function KanbanBoard({ deliveries }: { deliveries: Delivery[] }) {
  const byStatus = (status: string) => deliveries.filter((d) => d.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_STATUSES.map(({ key, label, color }) => {
        const items = byStatus(key);
        return (
          <div key={key} className={`rounded-xl border-2 ${color} p-3 space-y-3 min-h-[200px]`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
              <span className="text-xs rounded-full bg-muted px-2 py-0.5 font-mono">{items.length}</span>
            </div>

            {items.length === 0 && (
              <p className="text-xs text-muted-foreground text-center pt-6">No deliveries</p>
            )}

            {items.map((d) => (
              <Card key={d.id} className="shadow-none border rounded-lg">
                <CardContent className="p-3 space-y-2">
                  <div className="font-medium text-sm truncate">{d.basket?.name || "Food Items"}</div>
                  <div className="text-xs text-muted-foreground truncate" title={d.address}>
                    📍 {d.addressLabel ? `${d.addressLabel} — ` : ""}{d.address}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(d.requestedAt).toLocaleString()}
                  </div>
                  <DeliveryStatusChanger deliveryId={d.id} currentStatus={d.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
