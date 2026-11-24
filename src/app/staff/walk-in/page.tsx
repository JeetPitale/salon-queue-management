"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scissors,
  ArrowLeft,
  User,
  Phone,
  Check,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export default function AddWalkIn() {
  const router = useRouter();
  const [salonId, setSalonId] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Confirmation modal (F3: "shows token and estimated wait to read aloud")
  const [createdEntry, setCreatedEntry] = useState<{
    tokenNumber: number;
    waitMinutes: number;
    customerName: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/salon")
      .then((r) => r.json())
      .then((data) => {
        if (data.salon) {
          setSalonId(data.salon.id);
          setServices(data.services || []);
        }
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (name.trim().length < 2 || name.trim().length > 60) {
      setErrorMsg("Please enter a valid customer name (2-60 characters)");
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit phone number");
      return;
    }

    if (selectedIds.length === 0) {
      setErrorMsg("Please select at least one service");
      return;
    }

    setLoading(true);
    try {
      // F3: Receptionist adds walk-in without OTP
      const res = await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId,
          name: name.trim(),
          phone: cleanPhone,
          serviceIds: selectedIds,
          isWalkIn: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add walk-in");
      }

      setCreatedEntry({
        tokenNumber: data.entry.tokenNumber,
        waitMinutes: data.entry.estimatedWaitMinutes,
        customerName: name.trim(),
      });

      // Reset form
      setName("");
      setPhone("");
      setSelectedIds([]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error creating walk-in token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans overflow-x-hidden">
      <header className="bg-white border-b border-[#E4E1DC] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/staff/queue"
            className="p-1.5 rounded-lg border border-[#E4E1DC] text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-black text-lg sm:text-xl text-primary">Add Walk-in Customer (S3)</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E4E1DC] shadow-sm p-5 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-primary">New Customer Registration</h2>
            <p className="text-xs text-muted">
              Add walk-in customer turn without OTP. Read out token and wait estimate aloud.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#F4CCCC] border border-[#8B1A1A]/40 text-[#8B1A1A] text-sm font-semibold rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Customer Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-base sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-base sm:text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                Select Requested Services
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-h-60 overflow-y-auto p-1">
                {services.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all select-none ${
                        isSelected
                          ? "border-accent bg-white shadow-sm"
                          : "border-[#E4E1DC] bg-[#FAF8F5] hover:border-muted"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-sm text-[#1B1B1F] truncate">{s.name}</p>
                        <p className="text-xs text-muted">
                          {s.durationMinutes}m • ₹{s.price}
                        </p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${
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
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E4E1DC] flex items-center justify-between text-sm">
              <span className="text-muted font-medium">
                {selectedIds.length} service(s) • Total Time: <strong>{totalDuration} mins</strong>
              </span>
              <span className="font-extrabold text-lg text-primary">
                Total: ₹{totalPrice}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || selectedIds.length === 0}
              className={`w-full min-h-[48px] rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-sm ${
                selectedIds.length > 0 && !loading
                  ? "bg-primary hover:bg-[#182e4c] text-white active:scale-95"
                  : "bg-[#E4E1DC] text-muted cursor-not-allowed"
              }`}
            >
              <span>{loading ? "Allocating Token..." : "Issue Token & Add to Queue"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>

      {/* Confirmation Modal to Read Aloud (F3) */}
      {createdEntry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-8 text-center space-y-4 sm:space-y-5 border border-[#E4E1DC] shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-[#D9EAD3] text-[#2D6A1F] flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">
                Read Aloud to Customer
              </p>
              <div className="w-28 h-28 rounded-full bg-accent/15 border-4 border-accent text-primary flex items-center justify-center mx-auto my-3">
                <span className="text-5xl font-black">
                  #{createdEntry.tokenNumber}
                </span>
              </div>
              <p className="font-bold text-lg text-[#1B1B1F]">
                {createdEntry.customerName}
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E4E1DC]">
              <span className="text-sm font-semibold text-muted">
                Estimated Wait Time:
              </span>
              <p className="text-2xl font-black text-primary">
                ~{createdEntry.waitMinutes} minutes
              </p>
            </div>

            <button
              onClick={() => {
                setCreatedEntry(null);
                router.push("/staff/queue");
              }}
              className="w-full min-h-[48px] bg-primary text-white font-bold rounded-xl"
            >
              Done & Return to Queue Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
