import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function makeMissingClient() {
  const handler: ProxyHandler<any> = {
    get() {
      return () => {
        throw new Error('Supabase client not initialized. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      };
    },
  };
  return new Proxy({}, handler);
}

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn instead of throwing so pages can be previewed without Vite envs.
  // Consumers will get a clear error if they attempt to use the client.
  // eslint-disable-next-line no-console
  console.warn('VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY missing; Supabase client not initialized.');
}

export const supabase: SupabaseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (makeMissingClient() as unknown as SupabaseClient);
