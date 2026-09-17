import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth-server";
export { dynamic } from "@/lib/api-runtime";

export async function POST() {
  const response = NextResponse.json({
    message: "Logout successful.",
  });

  clearAuthCookie(response);

  return response;
}
