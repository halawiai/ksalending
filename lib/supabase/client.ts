import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

// Create a function to get environment variables safely
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url: supabaseUrl,
    key: supabaseAnonKey,
    hasConfig: !!(supabaseUrl && supabaseAnonKey)
  };
}

const config = getSupabaseConfig();

// Only create the client if we have valid configuration
export const supabase = config.hasConfig 
  ? createClientComponentClient<Database>()
  : null;

// Export a function to check if Supabase is configured
export const isSupabaseConfigured = () => config.hasConfig;

// Export a function to get the client safely
export const getSupabaseClient = () => {
  if (!config.hasConfig) {
    console.warn('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    return null;
  }
  return supabase;
};