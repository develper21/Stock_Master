import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-custom";
import { setAuthCookie } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function POST(req) {
  try {
    const { loginId, password } = await req.json();

    if (!loginId || !password) {
      return NextResponse.json({ error: "Login ID and password are required." }, { status: 400 });
    }

    // Authenticate user with custom auth
    const { user, token } = await authenticateUser(loginId, password);

    // Set auth cookie
    const response = NextResponse.json({
      message: "Login successful.",
      user,
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: error.message || "Invalid credentials." }, { status: 401 });
  }
}
