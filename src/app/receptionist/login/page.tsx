"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Lock, User, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";

export default function ReceptionistLogin() {
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
          expectedRole: "RECEPTIONIST",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Receptionist authentication failed");
      }

      // Store isolated Receptionist session
      localStorage.setItem("receptionist_user", JSON.stringify(data.user));
      localStorage.setItem("staff_user", JSON.stringify(data.user));
      router.push("/staff/queue");
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
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-md">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            Reception Desk Portal
          </h1>
          <p className="text-xs text-muted">
            Front-desk management for walk-in arrivals, payments, and calling turns
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
              Receptionist Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="receptionist"
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
            <span>{loading ? "Signing in..." : "Sign In to Reception Desk"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#E4E1DC] text-center space-y-3">
          <button
            type="button"
            onClick={() => {
              setUsername("receptionist");
              setPassword("password123");
            }}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Auto-fill Receptionist Demo (receptionist / password123)
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-muted pt-1">
            <Link href="/stylist/login" className="hover:text-primary">
              Stylist Login →
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
