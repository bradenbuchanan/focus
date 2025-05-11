// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

// Simple server-side Supabase client - no auth handling
export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}