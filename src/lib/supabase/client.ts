import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton: reuse the same browser client across components
const browserClient = createBrowserClient(url, key)

export function createClient() {
  return browserClient
}
