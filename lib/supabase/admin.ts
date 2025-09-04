import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables safely
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    serviceKey: supabaseServiceKey,
    hasConfig: !!(supabaseUrl && supabaseAnonKey)
  };
}

const config = getSupabaseConfig();

// Only create clients if we have valid configuration
export const supabaseAnon = config.hasConfig 
  ? createClient<Database>(config.url!, config.anonKey!)
  : null;

// Admin client with service role key
export const supabaseAdmin = (config.hasConfig && config.serviceKey)
  ? createClient<Database>(config.url!, config.serviceKey)
  : supabaseAnon;

// Legacy export for backward compatibility
export const supabaseService = supabaseAdmin;

// Export helper functions
export const isSupabaseConfigured = () => config.hasConfig;
export const getSupabaseAdmin = () => supabaseAdmin;