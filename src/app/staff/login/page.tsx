"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors, Lock, User, ArrowRight, AlertCircle, ShieldAlert } from "lucide-react";

export default function StaffLogin() {
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
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save staff user session to localStorage
      localStorage.setItem("staff_user", JSON.stringify(data.user));

      // Receptionist & Stylist land on S2 (/staff/queue), Admin lands on A4 (/admin/reports)
      if (data.user.role === "ADMIN") {
        router.push("/admin/reports");
      } else {
        router.push("/staff/queue");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E4E1DC] shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-md">
            <Scissors className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            Staff Portal Login
          </h1>
          <p className="text-xs text-muted">
            Access queue board, walk-in registration, and reports
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#F4CCCC] border border-[#8B1A1A]/30 text-[#8B1A1A] text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="receptionist or stylist username"
                className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl pl-11 pr-4 py-3 text-sm text-[#1B1B1F] outline-none"
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
                className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl pl-11 pr-4 py-3 text-sm text-[#1B1B1F] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] bg-primary hover:bg-[#182e4c] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base shadow-sm transition-all active:scale-[0.98] mt-2"
          >
            <span>{loading ? "Signing in..." : "Sign In to Console"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Demo Access Buttons */}
        <div className="pt-4 border-t border-[#E4E1DC] space-y-2">
          <p className="text-xs font-bold text-muted uppercase tracking-wider text-center">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuick("receptionist", "password123")}
              className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E4E1DC] hover:border-primary font-semibold text-primary truncate"
            >
              Receptionist
            </button>
            <button
              type="button"
              onClick={() => fillQuick("aarav", "password123")}
              className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E4E1DC] hover:border-primary font-semibold text-primary truncate"
            >
              Stylist Aarav
            </button>
            <button
              type="button"
              onClick={() => fillQuick("admin", "password123")}
              className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E4E1DC] hover:border-primary font-semibold text-primary truncate"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-muted hover:text-primary">
            ← Return to Customer Screen
          </Link>
        </div>
      </div>
    </div>
  );
}
