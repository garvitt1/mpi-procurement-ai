/**
 * MPI Observability & Procurement Funnel Telemetry Service
 *
 * Implements privacy-preserving telemetry tracking for procurement milestones,
 * AI capability latencies, and operational failure rates.
 * Does NOT track sensitive business secrets, credentials, or PII.
 */

export type TelemetryEventType =
  | "landing_view"
  | "requirement_started"
  | "requirement_submitted"
  | "ai_parsing_completed"
  | "match_generated"
  | "comparison_started"
  | "quote_requested"
  | "procurement_started"
  | "escrow_milestone_created"
  | "ai_latency"
  | "ai_error"
  | "rate_limit_exceeded"

export interface TelemetryEvent {
  event: TelemetryEventType
  timestamp: string
  sessionId: string
  metadata?: Record<string, string | number | boolean | null>
}

// In-memory telemetry buffer with localStorage persistence
const TELEMETRY_STORAGE_KEY = "mpi_telemetry_events"
const MAX_BUFFERED_EVENTS = 100

function getSessionId(): string {
  if (typeof window === "undefined") return "server"
  let sid = sessionStorage.getItem("mpi_session_id")
  if (!sid) {
    sid = `ses_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`
    sessionStorage.setItem("mpi_session_id", sid)
  }
  return sid
}

export function trackTelemetryEvent(
  event: TelemetryEventType,
  metadata?: Record<string, string | number | boolean | null>,
): void {
  const telemetryItem: TelemetryEvent = {
    event,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    metadata: metadata || {},
  }

  // Debug logging in development mode
  if (import.meta.env.DEV) {
    console.debug(`[MPI Telemetry] ${event}`, telemetryItem.metadata)
  }

  if (typeof window === "undefined") return

  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY)
    const list: TelemetryEvent[] = raw ? JSON.parse(raw) : []
    list.push(telemetryItem)
    if (list.length > MAX_BUFFERED_EVENTS) {
      list.shift()
    }
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // LocalStorage quota or access exception silently handled
  }
}

/**
 * Tracks AI invocation latency and outcome (Section 34)
 */
export function trackAILatency(capabilityId: string, latencyMs: number, status: "success" | "error" | "rate_limited"): void {
  trackTelemetryEvent("ai_latency", {
    capabilityId,
    latencyMs,
    status,
  })
}

/**
 * Retrieves recent telemetry events for Admin platform telemetry analytics
 */
export function getRecentTelemetryEvents(): TelemetryEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
