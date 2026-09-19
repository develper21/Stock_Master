import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth-server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function POST() {
  const response = NextResponse.json({
    message: "Logout successful.",
  });

  clearAuthCookie(response);

  return response;
}
