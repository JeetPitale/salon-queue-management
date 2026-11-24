"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
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
          expectedRole: "ADMIN",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Admin authentication failed");
      }

      // Store isolated Admin session
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      router.push("/admin/reports");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111C2B] text-white flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[#1A283B] rounded-3xl border border-white/10 shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-accent text-white flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Admin Management Portal
          </h1>
          <p className="text-xs text-white/60">
            Restricted access for Salon Owners &amp; General Managers
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#F4CCCC] border border-[#8B1A1A] text-[#8B1A1A] text-sm rounded-xl flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#111C2B] border border-white/20 focus:border-accent rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111C2B] border border-white/20 focus:border-accent rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] bg-accent hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base shadow-md transition-all active:scale-[0.98] mt-2"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Admin Portal"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Demo Fill */}
        <div className="pt-4 border-t border-white/10 text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              setUsername("admin");
              setPassword("password123");
            }}
            className="text-xs text-white/60 hover:text-white underline font-semibold"
          >
            Auto-fill Admin Demo Credentials (admin / password123)
          </button>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white"
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
