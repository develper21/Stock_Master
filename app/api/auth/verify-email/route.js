import { NextResponse } from "next/server";
import { verifyEmail } from "@/lib/email-verification";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required." }, 
        { status: 400 }
      );
    }

    await verifyEmail(token);

    return NextResponse.json({ 
      message: "Email verified successfully! You can now login.",
      success: true 
    });
  } catch (error) {
    console.error("Email verification failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify email." }, 
      { status: 400 }
    );
  }
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." }, 
        { status: 400 }
      );
    }

    const { sendEmailVerification } = await import("@/lib/email-verification");
    const result = await sendEmailVerification(email);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Resend verification email failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to send verification email." }, 
      { status: 500 }
    );
  }
}
