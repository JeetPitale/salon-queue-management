"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect /staff/login to /receptionist/login for clean isolated URL hierarchy
export default function StaffLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/receptionist/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
