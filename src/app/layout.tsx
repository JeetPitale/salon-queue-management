import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Velvet & Blade - Salon Queue Management",
  description: "Live queue tracking, digital tokens, and instant wait estimates",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F3A5F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans w-full overflow-x-hidden">
        <Providers>
          <div className="flex-1 flex flex-col w-full min-w-0">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
