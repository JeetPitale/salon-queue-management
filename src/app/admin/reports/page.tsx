"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import {
  Users,
  Clock,
  IndianRupee,
  Star,
  UserX,
  Download,
  Calendar,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface ReportsData {
  metrics: {
    footfall: number;
    completedCount: number;
    noShowRate: number;
    averageWait: number;
    revenue: number;
    avgRating: string;
  };
  hourly: { hour: string; count: number }[];
  serviceBreakdown: { name: string; count: number; revenue: number }[];
  entries: {
    tokenNumber: number;
    tokenDate: string;
    status: string;
    services: string;
    amount: number;
    paymentMethod: string;
    rating: number | null;
    createdAt: string;
  }[];
}

export default function ReportsDashboard() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!data?.entries || data.entries.length === 0) return;

    const headers = ["Token Number", "Date", "Status", "Services", "Amount", "Payment Method", "Rating", "Created At"];
    const rows = data.entries.map((e) => [
      `#${e.tokenNumber}`,
      e.tokenDate,
      e.status,
      `"${e.services}"`,
      e.amount,
      e.paymentMethod,
      e.rating || "N/A",
      new Date(e.createdAt).toLocaleString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `salon_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = data?.metrics;
  const maxHourlyCount = Math.max(1, ...(data?.hourly.map((h) => h.count) || [1]));

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Header & Date Range / CSV Action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-primary">Daily Reports & Analytics (A4)</h1>
            <p className="text-xs text-muted">
              Real-time footfall, wait duration trends, revenue, and satisfaction metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReports}
              className="p-2 rounded-xl bg-white border border-[#E4E1DC] text-muted hover:text-primary transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-[#182e4c] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 5 Key Metric Cards (A4 Spec) */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E4E1DC] shadow-sm">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Footfall</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-black text-primary">{metrics?.footfall ?? 0}</p>
            <p className="text-[11px] text-muted mt-1">{metrics?.completedCount ?? 0} served</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E1DC] shadow-sm">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Average Wait</span>
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <p className="text-3xl font-black text-primary">{metrics?.averageWait ?? 0}m</p>
            <p className="text-[11px] text-muted mt-1">across all visits</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E1DC] shadow-sm">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">No-show Rate</span>
              <UserX className="w-4 h-4 text-[#8B1A1A]" />
            </div>
            <p className="text-3xl font-black text-[#8B1A1A]">{metrics?.noShowRate ?? 0}%</p>
            <p className="text-[11px] text-muted mt-1">released after grace</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E1DC] shadow-sm">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Revenue</span>
              <IndianRupee className="w-4 h-4 text-[#2D6A1F]" />
            </div>
            <p className="text-3xl font-black text-[#2D6A1F]">₹{metrics?.revenue ?? 0}</p>
            <p className="text-[11px] text-muted mt-1">recorded payments</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E1DC] shadow-sm">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Rating</span>
              <Star className="w-4 h-4 text-accent fill-accent" />
            </div>
            <p className="text-3xl font-black text-accent">{metrics?.avgRating ?? "5.0"}</p>
            <p className="text-[11px] text-muted mt-1">customer score</p>
          </div>
        </div>

        {/* Charts & Breakdown Grid (A4 Spec) */}
        <div className="grid grid-cols-12 gap-6">
          {/* Customers Per Hour Chart (A4) */}
          <div className="col-span-7 bg-white p-6 rounded-2xl border border-[#E4E1DC] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span>Customers Per Hour</span>
              </h3>
              <span className="text-xs text-muted">Daily distribution</span>
            </div>

            <div className="h-56 flex items-end gap-2 pt-6 pb-2 border-b border-[#E4E1DC]">
              {data?.hourly.map((h) => {
                const heightPct = Math.max(8, Math.round((h.count / maxHourlyCount) * 100));
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                      {h.count}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all ${
                        h.count > 0 ? "bg-primary hover:bg-accent" : "bg-[#FAF8F5]"
                      }`}
                    />
                    <span className="text-[9px] text-muted font-mono mt-1">
                      {h.hour.split(":")[0]}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue By Service (A4) */}
          <div className="col-span-5 bg-white p-6 rounded-2xl border border-[#E4E1DC] shadow-sm space-y-4">
            <h3 className="font-bold text-base text-primary">Revenue by Service</h3>
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {data?.serviceBreakdown.length === 0 ? (
                <p className="text-xs text-muted text-center py-8">No service data yet today.</p>
              ) : (
                data?.serviceBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#1B1B1F]">{item.name}</p>
                      <p className="text-[10px] text-muted">{item.count} orders</p>
                    </div>
                    <span className="font-extrabold text-sm text-[#2D6A1F]">
                      ₹{item.revenue}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
