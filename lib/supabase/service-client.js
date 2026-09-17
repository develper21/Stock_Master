import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env.server";

let serviceClient;

export function getSupabaseServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient(
      serverEnv.supabaseUrl,
      serverEnv.supabaseServiceRoleKey,
      {
        // No auth configuration - database only
        db: {
          schema: 'public'
        }
      }
    );
  }
  return serviceClient;
}
