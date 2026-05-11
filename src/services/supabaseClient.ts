import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Optional: clean up the URL if the user accidentally included the REST path
const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(cleanUrl, supabaseAnonKey);
