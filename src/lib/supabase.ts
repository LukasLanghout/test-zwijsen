import { createClient } from '@supabase/supabase-js';

// process.env works in Node.js (API routes).
// In the Vite frontend build, vite.config.ts defines these via the `define` option.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
