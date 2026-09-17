import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env.server";

export async function apiFetch(path, init = {}) {
  const cookieStore = cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const response = await fetch(`${serverEnv.siteUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.headers || {}),
      Cookie: cookieHeader,
    },
  });

  return response;
}
