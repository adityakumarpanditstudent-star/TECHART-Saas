import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only initialize if we have the credentials, otherwise return a proxy or null
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get: () => {
        return () => ({ data: null, error: { message: 'Supabase not configured' } });
      }
    });
