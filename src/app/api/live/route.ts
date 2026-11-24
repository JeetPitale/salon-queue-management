import { NextRequest } from "next/server";
import { liveEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salonId");

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial ping
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

  const listener = (data: unknown) => {
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      // Connection closed
    }
  };

  const channel = salonId ? `salon:${salonId}` : "salon:all";
  liveEmitter.on(channel, listener);

  // Send periodic heartbeat every 20 seconds
  const interval = setInterval(() => {
    try {
      writer.write(encoder.encode(`: heartbeat\n\n`));
    } catch {
      clearInterval(interval);
    }
  }, 20000);

  req.signal.addEventListener("abort", () => {
    clearInterval(interval);
    liveEmitter.off(channel, listener);
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
