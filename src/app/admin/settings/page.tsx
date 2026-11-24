"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { Settings, Save, CheckCircle2, AlertCircle } from "lucide-react";

export default function SalonSettings() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("21:00");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(10);
  const [isOpen, setIsOpen] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.salon) {
          setName(data.salon.name);
          setAddress(data.salon.address);
          setPhone(data.salon.phone);
          setOpeningTime(data.salon.openingTime);
          setClosingTime(data.salon.closingTime);
          setGracePeriodMinutes(data.salon.gracePeriodMinutes || 10);
          setIsOpen(data.salon.isOpen);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          phone,
          openingTime,
          closingTime,
          gracePeriodMinutes: Number(gracePeriodMinutes),
          isOpen,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      setStatusMsg({ type: "success", text: "Salon configuration saved successfully!" });
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error saving settings",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans overflow-x-hidden">
      <AdminNav />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-primary">Salon Settings (A1)</h1>
          <p className="text-xs text-muted">
            Configure salon details, operating hours, and customer grace period.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2 text-sm font-semibold ${
              statusMsg.type === "success"
                ? "bg-[#D9EAD3] border-[#2D6A1F]/30 text-[#2D6A1F]"
                : "bg-[#F4CCCC] border-[#8B1A1A]/30 text-[#8B1A1A]"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E4E1DC] shadow-sm p-5 sm:p-8">
          <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
            {/* Open / Closed Toggle Switch */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E4E1DC] flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm sm:text-base text-[#1B1B1F]">Salon Operating Status</p>
                <p className="text-xs text-muted">
                  When closed, customer queue joining is paused. Active queues continue.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isOpen ? "bg-[#2D6A1F]" : "bg-[#8B1A1A]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isOpen ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                Salon Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-base sm:text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-base sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={gracePeriodMinutes}
                  onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                  className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-base sm:text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                Salon Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-base sm:text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Daily Opening Time
                </label>
                <input
                  type="time"
                  required
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-base sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Daily Closing Time
                </label>
                <input
                  type="time"
                  required
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-base sm:text-sm outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-[48px] bg-primary hover:bg-[#182e4c] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-base shadow-sm transition-all"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
