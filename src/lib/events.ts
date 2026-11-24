import { EventEmitter } from "events";

class LiveQueueEmitter extends EventEmitter {}

// Global singleton emitter for server-side queue events
const globalForEmitter = global as unknown as { liveEmitter: LiveQueueEmitter };

export const liveEmitter =
  globalForEmitter.liveEmitter || new LiveQueueEmitter();

liveEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEmitter.liveEmitter = liveEmitter;
}

export type LiveEventType =
  | "queue_updated"
  | "customer_called"
  | "customer_started"
  | "customer_completed"
  | "customer_cancelled"
  | "customer_no_show"
  | "stylist_updated";

export function broadcastQueueUpdate(salonId: string, event: LiveEventType, data?: unknown) {
  liveEmitter.emit(`salon:${salonId}`, { event, data, timestamp: new Date().toISOString() });
}
