"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Scissors,
  ArrowLeft,
  Search,
  RefreshCw,
  Phone,
  IndianRupee,
  Star,
  CheckCircle,
} from "lucide-react";

interface HistoryRow {
  id: string;
  tokenNumber: number;
  customerName: string;
  customerPhone: string;
  status: string;
  assignedStaff: string;
  services: string;
  totalPrice: number;
  payment: { amount: number; method: string } | null;
  feedback: { rating: number; comment: string | null } | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export default function TodaysHistory() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const url = search.trim()
        ? `/api/staff/history?q=${encodeURIComponent(search.trim())}`
        : "/api/staff/history";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.entries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans">
      <header className="bg-white border-b border-[#E4E1DC] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/staff/queue"
            className="p-1.5 rounded-lg border border-[#E4E1DC] text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-black text-xl text-primary">Today&apos;s History (S5)</h1>
        </div>

        {/* Search Input by Token or Phone (S5 Spec) */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by token or phone..."
            className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl pl-9 pr-4 py-2 text-xs outline-none"
          />
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted">
            Completed, cancelled, and no-show customer turns today.
          </p>
          <button
            onClick={fetchHistory}
            className="text-xs font-semibold text-muted hover:text-primary flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E1DC] shadow-sm overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center text-muted">
              <p className="font-bold text-base">No history records today</p>
              <p className="text-xs mt-1">Completed visits will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF8F5] border-b border-[#E4E1DC] text-xs font-bold text-muted uppercase">
                  <tr>
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Services</th>
                    <th className="py-3 px-4">Stylist</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1DC]">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-4 font-black text-base text-primary">
                        #{row.tokenNumber}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-[#1B1B1F]">{row.customerName}</p>
                        <p className="text-xs text-muted font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted/70" />
                          {row.customerPhone}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-[#1B1B1F]">
                        {row.services}
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-muted">
                        {row.assignedStaff}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={row.status} size="sm" />
                      </td>

                      <td className="py-3 px-4">
                        {row.payment ? (
                          <div className="text-xs">
                            <span className="font-bold text-[#2D6A1F]">₹{row.payment.amount}</span>
                            <span className="text-[10px] text-muted ml-1 uppercase font-semibold">
                              ({row.payment.method})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">Unpaid</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {row.feedback ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-accent">
                            <Star className="w-3.5 h-3.5 fill-accent" />
                            <span>{row.feedback.rating}/5</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
