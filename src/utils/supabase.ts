import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get the current authenticated user's ID.
 * Throws if not authenticated.
 */
export async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  return user.id;
}
