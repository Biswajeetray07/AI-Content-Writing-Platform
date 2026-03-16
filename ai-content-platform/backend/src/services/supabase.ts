import { createClient, SupabaseClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

// Prevent multiple instances in development (hot-reload safety)
const globalForSupabase = global as unknown as { supabase: SupabaseClient };

if (!globalForSupabase.supabase) {
  globalForSupabase.supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const supabase = globalForSupabase.supabase;
