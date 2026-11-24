"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors, Lock, User, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";

export default function StylistLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          expectedRole: "STYLIST",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Stylist authentication failed");
      }

      // Store isolated Stylist session
      localStorage.setItem("stylist_user", JSON.stringify(data.user));
      router.push("/stylist/queue");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-3 sm:p-4">
      <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl border border-[#E4E1DC] shadow-lg p-5 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-accent text-white flex items-center justify-center mx-auto shadow-md">
            <Scissors className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            Stylist Chair Portal
          </h1>
          <p className="text-xs text-muted">
            Service provider console for turn management, starts, and skill matching
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#F4CCCC] border border-[#8B1A1A]/40 text-[#8B1A1A] text-sm rounded-xl flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Stylist Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="aarav or priya"
                className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-accent rounded-xl pl-11 pr-4 py-3 text-sm text-[#1B1B1F] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-accent rounded-xl pl-11 pr-4 py-3 text-sm text-[#1B1B1F] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] bg-accent hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base shadow-sm transition-all active:scale-[0.98] mt-2"
          >
            <span>{loading ? "Signing in..." : "Open My Chair"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#E4E1DC] text-center space-y-3">
          <p className="text-xs font-bold text-muted uppercase tracking-wider">
            Quick Auto-Fill Stylist Demos
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setUsername("aarav");
                setPassword("password123");
              }}
              className="p-2.5 rounded-xl border border-[#E4E1DC] hover:border-accent font-semibold text-primary"
            >
              Stylist Aarav
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername("priya");
                setPassword("password123");
              }}
              className="p-2.5 rounded-xl border border-[#E4E1DC] hover:border-accent font-semibold text-primary"
            >
              Stylist Priya
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-muted pt-2">
            <Link href="/receptionist/login" className="hover:text-primary">
              Reception Desk →
            </Link>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-primary">
              Admin Login →
            </Link>
          </div>

          <div className="pt-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customer Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
