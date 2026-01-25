import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
export { dynamic } from "@/lib/api-runtime";

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
