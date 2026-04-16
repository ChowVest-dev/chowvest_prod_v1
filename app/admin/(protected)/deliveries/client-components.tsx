"use client";

import { useTransition } from "react";
import { updateDeliveryStatus } from "./actions";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function DeliveryStatusChanger({ deliveryId, currentStatus }: { deliveryId: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    startTransition(async () => {
      try {
        await updateDeliveryStatus(deliveryId, newStatus);
        toast.success(`Delivery moved to ${newStatus}`);
      } catch (e: any) {
        toast.error(e.message || "Failed to update delivery");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select 
        defaultValue={currentStatus} 
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px] h-9">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          <SelectValue placeholder="Update Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
          <SelectItem value="PREPARING">Preparing</SelectItem>
          <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
          <SelectItem value="DELIVERED">Delivered</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
