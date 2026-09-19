import { getSupabaseServiceClient } from "./service-client";

export function getSupabaseServerClient() {
  return getSupabaseServiceClient();
}
