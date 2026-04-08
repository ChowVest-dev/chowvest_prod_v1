"use client";

import { useEffect, useState } from "react";
import { Phone, MessageSquare, Star, Check } from "lucide-react";

interface LiveTrackingProps {
  delivery: any;
  onDeliveryComplete: () => void;
}

export function LiveTracking({ delivery, onDeliveryComplete }: LiveTrackingProps) {
  const [step, setStep] = useState(0); // 0: CONFIRMED, 1: IN_TRANSIT, 2: DELIVERED

  // Simulate mock polling / status progression over time
  useEffect(() => {
    // Move to In Transit after 4 seconds
    const transitTimer = setTimeout(() => {
      setStep(1);
    }, 4000);

    // Move to Delivered after 8 seconds
    const deliveredTimer = setTimeout(async () => {
      setStep(2);
      
      if (delivery?.id) {
        try {
          await fetch('/api/delivery/status', {
            method: 'POST',
            body: JSON.stringify({ deliveryId: delivery.id, status: 'DELIVERED' })
          });
        } catch (e) {
          console.error("Failed to update status", e);
        }
      }
      
      setTimeout(() => onDeliveryComplete(), 1500);
    }, 8000);

    return () => {
      clearTimeout(transitTimer);
      clearTimeout(deliveredTimer);
    };
  }, [onDeliveryComplete]);

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="rounded-2xl h-[200px] relative overflow-hidden bg-[#D4E8D0]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Roads */}
        <div className="absolute bg-[#ffffffb3] rounded-[3px] top-1/2 left-0 right-0 h-2 -translate-y-1/2"></div>
        <div className="absolute bg-[#ffffffb3] rounded-[3px] top-[30%] left-[10%] right-[30%] h-[6px]"></div>
        <div className="absolute bg-[#ffffffb3] rounded-[3px] left-[35%] top-0 bottom-0 w-2"></div>
        <div className="absolute bg-[#ffffffb3] rounded-[3px] left-[70%] top-[20%] bottom-[10%] w-[6px]"></div>
        <div className="absolute bg-[#ffffffb3] rounded-[3px] top-[60%] left-[40%] w-[120px] h-[6px] origin-left -rotate-30"></div>

        {/* Buildings */}
        <div className="absolute rounded bg-[#2D5A3D] opacity-20 w-[35px] h-[25px] top-[15%] left-[10%]"></div>
        <div className="absolute rounded bg-[#3A6B4A] opacity-20 w-[28px] h-[20px] top-[60%] left-[15%]"></div>
        <div className="absolute rounded bg-[#2D5A3D] opacity-20 w-[40px] h-[30px] top-[20%] left-[55%]"></div>
        <div className="absolute rounded bg-[#3A6B4A] opacity-20 w-[25px] h-[35px] top-[65%] left-[80%]"></div>
        <div className="absolute rounded bg-[#2D5A3D] opacity-20 w-[30px] h-[22px] top-[75%] left-[50%]"></div>

        {/* Route visualization */}
        {step >= 1 && (
          <>
            <div className="absolute top-1/2 left-[35%] h-1 bg-[#1B7A3D] -translate-y-1/2 rounded animate-[routeGrow_2s_ease-out_forwards] z-10 w-[35%]"></div>
            <div className="absolute top-1/2 left-[70%] w-[20%] h-0 border-t-[3px] border-dashed border-[#1B7A3D66] -translate-y-1/2 z-10"></div>
            
            {/* Rider marker */}
            <div className="absolute z-20 top-[43%] left-[60%] animate-[riderMove_4s_ease-in-out_infinite_alternate]">
               <div className="absolute -top-[28px] left-1/2 -translate-x-1/2 bg-[#0D1F12] text-white text-[10px] font-bold px-2 py-[3px] rounded-md whitespace-nowrap after:content-[''] after:absolute after:-bottom-[4px] after:left-1/2 after:-translate-x-1/2 after:border-l-[5px] after:border-l-transparent after:border-r-[5px] after:border-r-transparent after:border-t-[5px] after:border-t-[#0D1F12]">
                {delivery?.estimatedAt ? new Date(delivery.estimatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'ETA 15m'}
               </div>
               <div className="w-10 h-10 rounded-full bg-[#0D1F12] border-[3px] border-[#34A853] flex items-center justify-center text-lg shadow-md animate-[pulseRing_2s_infinite]">🛵</div>
            </div>
          </>
        )}

        {/* Pick up marker */}
        <div className="absolute top-[44%] left-[33%] z-[15]">
          <div className="w-7 h-7 rounded-full bg-[#1B7A3D] border-[3px] border-white flex items-center justify-center text-xs shadow-sm">🏪</div>
        </div>
        
        {/* Destination marker */}
        <div className="absolute top-[42%] right-[12%] z-[15]">
          <div className="w-8 h-8 rounded-full bg-[#E53935] border-[3px] border-white flex items-center justify-center text-sm shadow-sm animate-[destPulse_3s_infinite]">🏠</div>
        </div>

        {/* ETA Overlay */}
        <div className="absolute top-3 inset-x-3 flex justify-between z-30">
          <div className="bg-[#0D1F12] text-white px-3 py-2 rounded-xl shadow-md">
            <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Est. Arrival</div>
            <div className="text-lg font-bold">{delivery?.estimatedAt ? new Date(delivery.estimatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '10:45 AM'}</div>
          </div>
          <div className="bg-[#0D1F12] text-white px-3 py-2 rounded-xl shadow-md flex flex-col justify-center items-center">
            <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Wait Time</div>
            <div className="text-sm font-bold">{delivery?.deliveryOption === "EXPRESS" ? "35m" : "45m"}</div>
          </div>
        </div>
        <style jsx>{`
          @keyframes routeGrow { to { width: 35%; } }
          @keyframes riderMove { 0% { left: 55%; top: 43%; } 50% { left: 60%; top: 46%; } 100% { left: 64%; top: 44%; } }
          @keyframes pulseRing { 0%, 100% { box-shadow: 0 0 0 0 rgba(52,168,83,0.4), 0 4px 12px rgba(0,0,0,0.2); } 50% { box-shadow: 0 0 0 12px rgba(52,168,83,0), 0 4px 12px rgba(0,0,0,0.2); } }
          @keyframes destPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(229,57,53,0.3), 0 2px 8px rgba(0,0,0,0.15); } 50% { box-shadow: 0 0 0 8px rgba(229,57,53,0), 0 2px 8px rgba(0,0,0,0.15); } }
        `}</style>
      </div>

      {/* Stepper */}
      <div className="bg-white border border-[#EFEFEF] rounded-2xl p-4 relative">
        <div className="flex justify-between relative px-2">
          {/* Progress lines behind circles */}
          <div className="absolute top-[14px] left-8 right-8 h-[3px] bg-[#EFEFEF] rounded-sm z-0"></div>
          <div 
             className="absolute top-[14px] left-8 h-[3px] bg-[#1B7A3D] rounded-sm z-0 transition-all duration-1000 ease-in-out"
             style={{ width: step === 0 ? '0%' : step === 1 ? '50%' : '100%' }}
          ></div>
          
          <div className="flex flex-col items-center gap-1.5 z-10 min-w-[52px]">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              step >= 0 ? "bg-[#1B7A3D] text-white" : "bg-[#F6F7F9] border-2 border-[#EFEFEF] text-[#9A9FA5]"
            }`}>
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className={`text-[10px] text-center ${step >= 0 ? "text-[#1B7A3D] font-bold" : "text-[#6F767E] font-semibold"}`}>Confirmed</div>
          </div>

          <div className="flex flex-col items-center gap-1.5 z-10 min-w-[52px]">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              step >= 1 ? "bg-[#1B7A3D] text-white" : step === 0 ? "bg-white border-[3px] border-[#1B7A3D]" : "bg-[#F6F7F9] border-2 border-[#EFEFEF] text-[#9A9FA5]"
            }`}>
              {step >= 1 ? <Check className="w-3.5 h-3.5" /> : step === 0 ? <div className="w-2 h-2 rounded-full bg-[#1B7A3D]"></div> : "2"}
            </div>
            <div className={`text-[10px] text-center ${step >= 1 ? "text-[#1B7A3D] font-bold" : step === 0 ? "text-[#1B7A3D] font-bold" : "text-[#6F767E] font-semibold"}`}>In Transit</div>
          </div>

          <div className="flex flex-col items-center gap-1.5 z-10 min-w-[52px]">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              step >= 2 ? "bg-[#1B7A3D] text-white" : step === 1 ? "bg-white border-[3px] border-[#1B7A3D]" : "bg-[#F6F7F9] border-2 border-[#EFEFEF] text-[#9A9FA5]"
            }`}>
              {step >= 2 ? <Check className="w-3.5 h-3.5" /> : step === 1 ? <div className="w-2 h-2 rounded-full bg-[#1B7A3D]"></div> : "3"}
            </div>
            <div className={`text-[10px] text-center ${step >= 2 ? "text-[#1B7A3D] font-bold" : step === 1 ? "text-[#1B7A3D] font-bold" : "text-[#6F767E] font-semibold"}`}>Delivered</div>
          </div>
        </div>
      </div>

      {/* Rider Info */}
      <div className="bg-white border border-[#EFEFEF] rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#0D1F12] flex items-center justify-center text-[#34A853] font-bold text-lg shrink-0 outline outline-4 outline-[#E9F5EE]">
          {delivery?.riderName ? delivery.riderName.charAt(0) : "R"}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-bold text-[#1A1D1F]">{delivery?.riderName || "Tunde Bakare"}</div>
          <div className="text-[12px] text-[#6F767E] flex items-center gap-1 mt-0.5">
             <Star className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" /> {delivery?.riderRating || "4.9"} · {delivery?.deliveryOption === "EXPRESS" ? "Express" : "Standard"} Courier
          </div>
        </div>
        <div className="flex gap-2">
           <button className="w-10 h-10 rounded-full border border-[#EFEFEF] bg-white hover:bg-[#E9F5EE] hover:border-[#1B7A3D] flex items-center justify-center transition-colors text-[#1A1D1F]">
             <MessageSquare className="w-4 h-4" />
           </button>
           <button className="w-10 h-10 rounded-full bg-[#1B7A3D] border border-[#1B7A3D] flex items-center justify-center text-white shadow-md">
             <Phone className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Mini Order Summary */}
      <div className="bg-white border border-[#EFEFEF] rounded-2xl p-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-[10px] bg-[#E9F5EE] flex items-center justify-center text-[22px] shrink-0">
          🛍️
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-[#1A1D1F]">Order #{delivery?.id ? delivery.id.substring(delivery.id.length - 6).toUpperCase() : "12940"}</div>
          <div className="text-[11px] text-[#6F767E] mt-0.5">{delivery?.basketId ? "Basket Goal Delivery" : "Delivery Request"}</div>
        </div>
        <div className="bg-[#E9F5EE] text-[#1B7A3D] text-[11px] font-bold px-3 py-1 rounded-full border border-[#1B7A3D33]">
           PAID
        </div>
      </div>
    </div>
  );
}
