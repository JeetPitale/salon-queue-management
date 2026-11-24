"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { OnboardingTour } from "@/components/OnboardingTour";
import {
  Scissors,
  Users,
  Clock,
  Phone,
  Play,
  CheckCircle,
  Bell,
  XCircle,
  AlertOctagon,
  LogOut,
  PlusCircle,
  History,
  CreditCard,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

interface QueueRow {
  id: string;
  tokenNumber: number;
  customerName: string;
  customerPhone: string;
  status: string;
  estimatedWaitMinutes: number;
  calledAt: string | null;
  startedAt: string | null;
  assignedStaff: { id: string; name: string } | null;
  services: { id: string; name: string; durationMinutes: number; price: number }[];
  isWalkIn: boolean;
  createdAt: string;
}

interface StylistItem {
  id: string;
  name: string;
  status: "AVAILABLE" | "BUSY" | "ON_BREAK" | "OFF_DUTY";
  skills: { id: string; name: string }[];
}

export default function QueueBoard() {
  const router = useRouter();
  const [staffUser, setStaffUser] = useState<{
    id: string;
    name: string;
    role: string;
    salonId: string;
  } | null>(null);

  const [entries, setEntries] = useState<QueueRow[]>([]);
  const [stylists, setStylists] = useState<StylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // S4 Payment Modal state
  const [paymentModalEntry, setPaymentModalEntry] = useState<QueueRow | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Call Next Stylist Selection Modal state
  const [callModalEntry, setCallModalEntry] = useState<QueueRow | null>(null);
  const [selectedStylistId, setSelectedStylistId] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("staff_user");
    if (!stored) {
      router.replace("/staff/login");
      return;
    }
    setStaffUser(JSON.parse(stored));
  }, [router]);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/staff/queue");
      if (res.ok) {
        const json = await res.json();
        setEntries(json.entries || []);
        setStylists(json.stylists || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // SSE Live updates for < 2s refresh (F4)
    const eventSource = new EventSource("/api/live");
    eventSource.onmessage = () => {
      fetchQueue();
    };

    const interval = setInterval(fetchQueue, 5000);
    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const handleAction = async (action: string, entryId: string, staffId?: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, entryId, staffId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      // If completing, open S4 Payment Modal automatically (F5 & F8)
      if (action === "complete") {
        const completedRow = entries.find((e) => e.id === entryId);
        if (completedRow) {
          setPaymentModalEntry(completedRow);
        }
      }

      fetchQueue();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleUpdateStylistStatus = async (
    sId: string,
    newStatus: "AVAILABLE" | "BUSY" | "ON_BREAK" | "OFF_DUTY"
  ) => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/staff/stylist-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: sId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Status update failed");
      }
      fetchQueue();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to change stylist status");
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentModalEntry) return;
    setPaymentLoading(true);
    setErrorMsg(null);
    try {
      const totalAmount = paymentModalEntry.services.reduce((acc, s) => acc + s.price, 0);
      const res = await fetch("/api/staff/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: paymentModalEntry.id,
          amount: totalAmount,
          method: paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment recording failed");
      }
      setPaymentModalEntry(null);
      fetchQueue();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("staff_user");
    router.replace("/staff/login");
  };

  // Filter queue entries if stylist is logged in (spec S2: "Stylists see only their own customers", but receptionist sees all)
  const isStylist = staffUser?.role === "STYLIST";
  const displayedEntries = isStylist
    ? entries.filter(
        (e) => !e.assignedStaff || e.assignedStaff.id === staffUser.id || e.status === "WAITING"
      )
    : entries;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans overflow-x-hidden">
      {/* Staff Header */}
      <header className="bg-white border-b border-[#E4E1DC] sticky top-0 z-30 px-4 sm:px-6 py-2.5 sm:py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/staff/queue" className="flex items-center gap-2 font-black text-lg sm:text-xl text-primary shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4" />
              </div>
              <span>Staff Console</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-2 text-sm font-semibold">
              <Link
                href="/staff/queue"
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold"
              >
                Queue Board (S2)
              </Link>
              {staffUser?.role !== "STYLIST" && (
                <Link
                  href="/staff/walk-in"
                  className="px-3 py-1.5 rounded-lg text-muted hover:text-primary hover:bg-[#FAF8F5] flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Walk-in (S3)</span>
                </Link>
              )}
              <Link
                href="/staff/history"
                className="px-3 py-1.5 rounded-lg text-muted hover:text-primary hover:bg-[#FAF8F5] flex items-center gap-1.5"
              >
                <History className="w-4 h-4" />
                <span>Today&apos;s History (S5)</span>
              </Link>
              {staffUser?.role === "ADMIN" && (
                <Link
                  href="/admin/reports"
                  className="px-3 py-1.5 rounded-lg text-accent hover:bg-accent/10 font-bold"
                >
                  Admin Dashboard →
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-primary truncate max-w-[140px]">{staffUser?.name}</p>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                {staffUser?.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="hidden lg:flex p-2 rounded-lg text-muted hover:text-[#8B1A1A] hover:bg-[#F4CCCC]/30 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg border border-[#E4E1DC] text-primary hover:bg-[#FAF8F5] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-3 pb-2 border-t border-[#E4E1DC] mt-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            {staffUser && (
              <div className="px-3 py-1.5 text-xs font-bold text-muted bg-[#FAF8F5] rounded-lg">
                Signed in as: <span className="text-primary">{staffUser.name}</span> ({staffUser.role})
              </div>
            )}
            <Link
              href="/staff/queue"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-primary text-white"
            >
              <Scissors className="w-4 h-4" />
              <span>Queue Board (S2)</span>
            </Link>
            {staffUser?.role !== "STYLIST" && (
              <Link
                href="/staff/walk-in"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-[#FAF8F5]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Walk-in (S3)</span>
              </Link>
            )}
            <Link
              href="/staff/history"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-[#FAF8F5]"
            >
              <History className="w-4 h-4" />
              <span>Today&apos;s History (S5)</span>
            </Link>
            {staffUser?.role === "ADMIN" && (
              <Link
                href="/admin/reports"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-accent hover:bg-accent/10"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
            )}
            <div className="pt-2 border-t border-[#E4E1DC]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#F4CCCC]/40 text-[#8B1A1A] font-bold text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Grid: Responsive 1 col on mobile/tablet, 12-col on large screens */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Error Alert */}
        {errorMsg && (
          <div className="col-span-1 lg:col-span-12 p-3 rounded-xl bg-[#F4CCCC] border border-[#8B1A1A]/40 text-[#8B1A1A] text-sm flex items-center justify-between">
            <span className="font-semibold">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-bold underline text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Left Column: Queue Table */}
        <div className="col-span-1 lg:col-span-8 flex flex-col space-y-4">
          <div id="tour-staff-stats" className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-primary">Live Queue List</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
                {displayedEntries.length} active
              </span>
            </div>

            <button
              onClick={fetchQueue}
              className="text-xs font-semibold text-muted hover:text-primary flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div id="tour-staff-list" className="bg-white rounded-2xl border border-[#E4E1DC] shadow-sm overflow-hidden">
            {displayedEntries.length === 0 ? (
              <div className="p-12 text-center text-muted">
                <Users className="w-12 h-12 text-muted/40 mx-auto mb-2" />
                <p className="font-semibold">Queue is currently empty</p>
                <p className="text-xs mt-1">No customers waiting or in service.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View (< 640px) */}
                <div className="sm:hidden divide-y divide-[#E4E1DC]">
                  {displayedEntries.map((row) => {
                    const isWaiting = row.status === "WAITING";
                    const isCalled = row.status === "CALLED";
                    const isInService = row.status === "IN_SERVICE";

                    return (
                      <div
                        key={`mob-${row.id}`}
                        className={`p-4 space-y-3 transition-colors ${
                          isCalled ? "bg-[#DCE9F7]/25" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xl text-primary">#{row.tokenNumber}</span>
                          <StatusBadge status={row.status} size="sm" />
                        </div>

                        <div>
                          <p className="font-bold text-sm text-[#1B1B1F]">{row.customerName}</p>
                          <p className="text-xs text-muted flex items-center gap-1 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-muted/70" />
                            {row.customerPhone}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted bg-[#FAF8F5] p-2 rounded-lg border border-[#E4E1DC]">
                          <div>
                            <span className="font-medium text-[#1B1B1F]">
                              {row.services.map((s) => s.name).join(", ")}
                            </span>
                            <span className="ml-1 text-[11px] font-bold text-accent">
                              ₹{row.services.reduce((sum, s) => sum + s.price, 0)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-primary">{row.estimatedWaitMinutes}m wait</span>
                            {row.assignedStaff && (
                              <p className="text-[10px] text-muted">{row.assignedStaff.name}</p>
                            )}
                          </div>
                        </div>

                        {/* Mobile Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {isWaiting && (
                            <button
                              onClick={() => {
                                setCallModalEntry(row);
                                if (staffUser?.role === "STYLIST") {
                                  setSelectedStylistId(staffUser.id);
                                } else {
                                  setSelectedStylistId(stylists[0]?.id || "");
                                }
                              }}
                              className="flex-1 py-2 rounded-lg bg-primary hover:bg-[#182e4c] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span>Call Next</span>
                            </button>
                          )}

                          {isCalled && (
                            <button
                              onClick={() => handleAction("start", row.id)}
                              className="flex-1 py-2 rounded-lg bg-[#6B3FA0] hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start</span>
                            </button>
                          )}

                          {isInService && (
                            <button
                              onClick={() => handleAction("complete", row.id)}
                              className="flex-1 py-2 rounded-lg bg-[#2D6A1F] hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          )}

                          {isCalled && (
                            <button
                              onClick={() => handleAction("no_show", row.id)}
                              className="px-3 py-2 rounded-lg border border-[#8B1A1A]/40 text-[#8B1A1A] hover:bg-[#F4CCCC]/30 text-xs font-semibold"
                            >
                              No-show
                            </button>
                          )}

                          {(isWaiting || isCalled) && (
                            <button
                              onClick={() => handleAction("cancel", row.id)}
                              className="p-2 rounded-lg text-muted hover:text-[#8B1A1A] hover:bg-[#F4CCCC]/30 transition-colors"
                              title="Cancel Turn"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (>= 640px) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAF8F5] border-b border-[#E4E1DC] text-xs font-bold text-muted uppercase">
                      <tr>
                        <th className="py-3 px-4">Token</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Services</th>
                        <th className="py-3 px-4">Wait</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Stylist</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E1DC]">
                      {displayedEntries.map((row) => {
                        const isWaiting = row.status === "WAITING";
                        const isCalled = row.status === "CALLED";
                        const isInService = row.status === "IN_SERVICE";

                        return (
                          <tr
                            key={row.id}
                            className={`hover:bg-[#FAF8F5]/60 transition-colors ${
                              isCalled ? "bg-[#DCE9F7]/25" : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-black text-lg text-primary">
                              #{row.tokenNumber}
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-bold text-[#1B1B1F]">{row.customerName}</p>
                              <p className="text-xs text-muted flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-muted/70" />
                                {row.customerPhone}
                              </p>
                            </td>

                            <td className="py-3 px-4">
                              <p className="font-medium text-xs text-[#1B1B1F]">
                                {row.services.map((s) => s.name).join(", ")}
                              </p>
                              <span className="text-[10px] text-muted font-bold">
                                ₹{row.services.reduce((sum, s) => sum + s.price, 0)}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-xs font-bold text-primary">
                              {row.estimatedWaitMinutes}m
                            </td>

                            <td className="py-3 px-4">
                              <StatusBadge status={row.status} size="sm" />
                            </td>

                            <td className="py-3 px-4 text-xs font-semibold text-muted">
                              {row.assignedStaff ? row.assignedStaff.name : "—"}
                            </td>

                            {/* Action Buttons strictly conforming to R3 */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* R3: WAITING -> CALLED */}
                                {isWaiting && (
                                  <button
                                    id="tour-staff-call-btn"
                                    onClick={() => {
                                      setCallModalEntry(row);
                                      // Preselect current stylist if logged in as STYLIST
                                      if (staffUser?.role === "STYLIST") {
                                        setSelectedStylistId(staffUser.id);
                                      } else {
                                        setSelectedStylistId(stylists[0]?.id || "");
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-[#182e4c] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                                  >
                                    <Bell className="w-3.5 h-3.5" />
                                    <span>Call Next</span>
                                  </button>
                                )}

                                {/* R3: CALLED -> IN_SERVICE */}
                                {isCalled && (
                                  <button
                                    onClick={() => handleAction("start", row.id)}
                                    className="px-3 py-1.5 rounded-lg bg-[#6B3FA0] hover:opacity-90 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    <span>Start</span>
                                  </button>
                                )}

                                {/* R3: IN_SERVICE -> COMPLETED */}
                                {isInService && (
                                  <button
                                    onClick={() => handleAction("complete", row.id)}
                                    className="px-3 py-1.5 rounded-lg bg-[#2D6A1F] hover:opacity-90 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Complete</span>
                                  </button>
                                )}

                                {/* R3: CALLED -> NO_SHOW */}
                                {isCalled && (
                                  <button
                                    onClick={() => handleAction("no_show", row.id)}
                                    className="px-2.5 py-1.5 rounded-lg border border-[#8B1A1A]/40 text-[#8B1A1A] hover:bg-[#F4CCCC]/30 text-xs font-semibold"
                                    title="Mark as No-Show"
                                  >
                                    No-show
                                  </button>
                                )}

                                {/* R3: WAITING or CALLED -> CANCELLED */}
                                {(isWaiting || isCalled) && (
                                  <button
                                    onClick={() => handleAction("cancel", row.id)}
                                    className="p-1.5 rounded-lg text-muted hover:text-[#8B1A1A] hover:bg-[#F4CCCC]/30 transition-colors"
                                    title="Cancel Turn"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Stylists Availability Panel (S2 spec) */}
        <div id="tour-staff-actions" className="col-span-1 lg:col-span-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Stylists Panel</h2>
            <span className="text-xs text-muted font-medium">
              {stylists.filter((s) => s.status !== "OFF_DUTY").length} Working
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E1DC] shadow-sm p-4 space-y-3">
            {stylists.map((stylist) => {
              const statusColors: Record<string, { bg: string; text: string }> = {
                AVAILABLE: { bg: "#D9EAD3", text: "#2D6A1F" },
                BUSY: { bg: "#EADCF5", text: "#6B3FA0" },
                ON_BREAK: { bg: "#FCE5CD", text: "#B45F06" },
                OFF_DUTY: { bg: "#E8E8E8", text: "#555555" },
              };

              const currentTheme = statusColors[stylist.status] || statusColors.OFF_DUTY;

              return (
                <div
                  key={stylist.id}
                  className="p-3.5 rounded-xl border border-[#E4E1DC] bg-[#FAF8F5]/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#1B1B1F]">
                        {stylist.name}
                      </h4>
                      <p className="text-[10px] text-muted">
                        Skills: {stylist.skills.map((sk) => sk.name).join(", ")}
                      </p>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
                    >
                      {stylist.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                    {(["AVAILABLE", "BUSY", "ON_BREAK", "OFF_DUTY"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStylistStatus(stylist.id, st)}
                        className={`py-1 rounded border transition-colors ${
                          stylist.status === st
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-muted border-[#E4E1DC] hover:border-muted"
                        }`}
                      >
                        {st === "AVAILABLE"
                          ? "Free"
                          : st === "BUSY"
                          ? "Busy"
                          : st === "ON_BREAK"
                          ? "Break"
                          : "Off"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* S4 Payment Modal (Opens after Complete - S4 Spec) */}
      {paymentModalEntry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 border border-[#E4E1DC] shadow-2xl space-y-5 sm:space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#D9EAD3] text-[#2D6A1F] flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-black text-2xl text-primary">Record Payment</h3>
              <p className="text-xs text-muted">
                Customer: <strong>{paymentModalEntry.customerName}</strong> (Token #{paymentModalEntry.tokenNumber})
              </p>
            </div>

            {/* Service Itemization */}
            <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E4E1DC] space-y-2">
              <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Completed Services
              </div>
              {paymentModalEntry.services.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="font-semibold text-primary">₹{s.price}</span>
                </div>
              ))}
              <div className="border-t border-[#E4E1DC] pt-2 flex items-center justify-between text-base font-extrabold text-[#1B1B1F]">
                <span>Total Due</span>
                <span className="text-xl text-primary font-black">
                  ₹{paymentModalEntry.services.reduce((acc, s) => acc + s.price, 0)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector (R7: cash, upi, card) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["CASH", "UPI", "CARD"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                      paymentMethod === method
                        ? "border-accent bg-accent/10 text-accent shadow-sm"
                        : "border-[#E4E1DC] bg-white text-[#1B1B1F] hover:border-muted"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalEntry(null)}
                className="flex-1 py-3 rounded-xl border border-[#E4E1DC] font-semibold text-sm text-[#1B1B1F]"
              >
                Skip / Later
              </button>
              <button
                type="button"
                disabled={paymentLoading}
                onClick={handleRecordPayment}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-[#182e4c] text-white font-black text-sm shadow-md"
              >
                {paymentLoading ? "Recording..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Next Modal with Skill-Matched Stylist Selector (R4) */}
      {callModalEntry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 border border-[#E4E1DC] shadow-2xl space-y-4 sm:space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-xl text-primary">
              Call Customer #{callModalEntry.tokenNumber}
            </h3>
            <p className="text-xs text-muted">
              Customer: <strong>{callModalEntry.customerName}</strong> ({callModalEntry.services.map((s) => s.name).join(", ")})
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                Assign Stylist (Must have required skills - R4)
              </label>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stylists.map((st) => {
                  const reqServiceIds = callModalEntry.services.map((s) => s.id);
                  const stSkillIds = st.skills.map((sk) => sk.id);
                  const isQualified = reqServiceIds.every((id) => stSkillIds.includes(id));

                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        if (isQualified) setSelectedStylistId(st.id);
                      }}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        !isQualified
                          ? "opacity-40 bg-[#FAF8F5] border-[#E4E1DC] cursor-not-allowed"
                          : selectedStylistId === st.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-[#E4E1DC] hover:border-primary/50"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-[#1B1B1F]">{st.name}</p>
                        <p className="text-[10px] text-muted">
                          Status: {st.status.replace("_", " ")}
                        </p>
                      </div>

                      {isQualified ? (
                        <span className="text-xs font-bold text-[#2D6A1F]">Qualified</span>
                      ) : (
                        <span className="text-xs font-bold text-[#8B1A1A]">Missing Skills</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCallModalEntry(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E4E1DC] font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedStylistId}
                onClick={() => {
                  handleAction("call", callModalEntry.id, selectedStylistId);
                  setCallModalEntry(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white ${
                  selectedStylistId ? "bg-primary hover:bg-[#182e4c]" : "bg-[#E4E1DC] cursor-not-allowed"
                }`}
              >
                Confirm Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Role Walkthrough */}
      <OnboardingTour role="staff" />
    </div>
  );
}
