// Re-export the official Supabase client to ensure a single instance
// with proper session persistence (localStorage + autoRefreshToken).
export { supabase } from "@/integrations/supabase/client";

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL,
  usesNextPublicVars: false,
};
