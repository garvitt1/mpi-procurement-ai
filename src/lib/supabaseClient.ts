import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://utjysxkaidvbrmatngyb.supabase.co"
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

/**
 * Diagnostic helper to check connection status to Supabase backend
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean
  url: string
  error?: string
}> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`)
    if (res.ok || res.status === 401) {
      return { connected: true, url: supabaseUrl }
    }
    return {
      connected: false,
      url: supabaseUrl,
      error: `HTTP ${res.status}: ${res.statusText}`,
    }
  } catch (err: unknown) {
    return {
      connected: false,
      url: supabaseUrl,
      error: err instanceof Error ? err.message : "Network error",
    }
  }
}
