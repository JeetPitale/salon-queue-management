"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Scissors,
  BarChart3,
  Settings,
  Sparkles,
  Users,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ name: string; username: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (!stored) {
      router.replace("/admin/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role !== "ADMIN") {
        localStorage.removeItem("admin_user");
        router.replace("/admin/login");
        return;
      }
      setAdminUser(parsed);
    } catch {
      router.replace("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    router.replace("/admin/login");
  };

  const links = [
    { href: "/admin/reports", label: "Reports Dashboard", icon: BarChart3 },
    { href: "/admin/settings", label: "Salon Settings", icon: Settings },
    { href: "/admin/services", label: "Services Manager", icon: Sparkles },
    { href: "/admin/staff", label: "Staff & Skills", icon: Users },
  ];

  return (
    <header className="bg-white border-b border-[#E4E1DC] sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <Link href="/admin/reports" className="flex items-center gap-2 font-black text-xl text-primary">
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>Admin Portal</span>
        </Link>

        <nav className="flex items-center gap-1.5 text-sm font-semibold">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-primary text-white font-bold"
                    : "text-muted hover:text-primary hover:bg-[#FAF8F5]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {adminUser && (
          <span className="text-xs font-bold text-primary">
            Admin: {adminUser.name}
          </span>
        )}

        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg border border-[#E4E1DC] text-muted hover:text-[#8B1A1A] hover:bg-[#F4CCCC]/30 transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Sign out of Admin Portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
