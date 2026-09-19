import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

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
