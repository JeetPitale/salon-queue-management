"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useLanguage } from "@/components/LanguageContext";
import { Check, Clock, IndianRupee, ArrowRight, AlertTriangle } from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

export default function JoinQueue() {
  const router = useRouter();
  const { t } = useLanguage();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [salonId, setSalonId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/salon")
      .then((r) => r.json())
      .then((data) => {
        if (data.salon) {
          setSalonId(data.salon.id);
          setServices(data.services || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggleService = (id: string) => {
    setErrorMsg(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleContinue = () => {
    if (selectedIds.length === 0) {
      setErrorMsg("Please select at least one service to continue");
      return;
    }

    // Save selection to session storage for OTP verification step C3
    sessionStorage.setItem(
      "queue_join_selection",
      JSON.stringify({
        salonId,
        serviceIds: selectedIds,
        totalPrice,
        totalDuration,
      })
    );

    router.push("/verify");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">{t("select_services")}</h1>
            <p className="text-sm text-muted">
              Choose one or more services for your turn today.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-[#F4CCCC] border border-[#8B1A1A]/30 p-3 rounded-xl flex items-center gap-2 text-sm text-[#8B1A1A]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3 py-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 bg-white rounded-xl border border-[#E4E1DC] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const isSelected = selectedIds.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-white border-accent shadow-sm"
                        : "bg-white border-[#E4E1DC] hover:border-muted/50"
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <h3 className="font-semibold text-base text-[#1B1B1F]">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          {service.durationMinutes} {t("mins")}
                        </span>
                        <span className="flex items-center gap-0.5 font-bold text-primary">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {service.price}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors ${
                        isSelected
                          ? "bg-accent border-accent text-white"
                          : "border-[#E4E1DC] bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Summary & Continue Button */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border border-[#E4E1DC] p-4 rounded-2xl shadow-lg mt-8 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t("total_time")}:</span>
            <span className="font-bold text-[#1B1B1F]">
              {totalDuration} {t("mins")}
            </span>
          </div>

          <div className="flex items-center justify-between text-base">
            <span className="font-semibold text-[#1B1B1F]">{t("total_price")}:</span>
            <span className="font-extrabold text-xl text-primary flex items-center">
              ₹{totalPrice}
            </span>
          </div>

          <button
            onClick={handleContinue}
            disabled={selectedIds.length === 0}
            className={`w-full min-h-[48px] rounded-xl font-bold flex items-center justify-center gap-2 text-base transition-all ${
              selectedIds.length > 0
                ? "bg-primary hover:bg-[#182e4c] text-white active:scale-[0.98]"
                : "bg-[#E4E1DC] text-muted cursor-not-allowed"
            }`}
          >
            <span>{t("continue")}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
