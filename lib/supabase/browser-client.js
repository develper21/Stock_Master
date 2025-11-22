"use client";

import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/lib/env.client";

let browserClient;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      clientEnv.supabaseUrl,
      clientEnv.supabaseAnonKey
    );
  }
  return browserClient;
}
