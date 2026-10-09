/**
 * MPI Observability & Procurement Funnel Telemetry Service
 *
 * Implements privacy-preserving telemetry tracking for procurement milestones,
 * AI capability latencies, and operational failure rates.
 * Does NOT track sensitive business secrets, credentials, or PII.
 */

import { hasConsent, hasUserDecided } from "./cookieConsentService"
import { supabase } from "../lib/supabaseClient"

export type TelemetryEventType =
  | "landing_view"
  | "cta_rfq_clicked"
  | "signup_completed"
  | "onboarding_step_viewed"
  | "rfq_dispatched"
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

/**
 * Asynchronously dispatches telemetry to configured production destination:
 * 1. If VITE_ANALYTICS_ENDPOINT is configured, uses navigator.sendBeacon or fetch.
 * 2. If Supabase is configured, attempts insert into `telemetry_events` table.
 * 3. Non-blocking error handling ensures user actions are never interrupted.
 */
async function dispatchToProductionDestination(item: TelemetryEvent): Promise<boolean> {
  let dispatched = false

  // 1. Check for configured HTTP beacon/REST analytics endpoint
  const analyticsEndpoint =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_ANALYTICS_ENDPOINT) || ""
  if (analyticsEndpoint && typeof window !== "undefined") {
    try {
      const payload = JSON.stringify(item)
      if (navigator.sendBeacon) {
        dispatched = navigator.sendBeacon(analyticsEndpoint, payload)
      } else {
        await fetch(analyticsEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        })
        dispatched = true
      }
    } catch {
      // Non-blocking fallback
    }
  }

  // 2. Dispatch to Supabase if client credentials are configured
  try {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY
    if (supabaseUrl && supabaseKey) {
      const { error } = await supabase.from("telemetry_events").insert({
        event: item.event,
        session_id: item.sessionId,
        metadata: item.metadata,
        created_at: item.timestamp,
      })
      if (!error) {
        dispatched = true
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return dispatched
}

export function trackTelemetryEvent(
  event: TelemetryEventType,
  metadata?: Record<string, string | number | boolean | null>,
): void {
  // Enforce GDPR/DPDP analytics consent: if user has made a choice and analytics is disabled,
  // do not record optional usage telemetry (essential error logs are exempted for platform stability)
  const isEssentialError = event === "ai_error" || event === "rate_limit_exceeded"
  if (!isEssentialError && hasUserDecided() && !hasConsent("analytics")) {
    return
  }

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

  // Asynchronously dispatch to production analytics destination
  // Fire-and-forget: does not block execution or raise uncaught errors
  dispatchToProductionDestination(telemetryItem).catch(() => {
    // Silently ignore network transport errors
  })
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
