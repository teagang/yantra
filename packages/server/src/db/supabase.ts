import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[DB] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — running in memory-only mode. ' +
    'Game state will not be persisted.'
  );
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    : null;

export const dbAvailable = supabase !== null;
