import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken, getUserById } from "./auth-custom";
import { getSupabaseServiceClient } from "./supabase/service-client";

export async function getSessionAndProfile({ redirectToLogin = false } = {}) {
  const supabase = getSupabaseServiceClient();
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken?.value) {
      if (redirectToLogin) {
        redirect("/auth/login");
      }
      return { user: null, profile: null, session: null, supabase };
    }

    // Verify token
    const decoded = verifyToken(authToken.value);
    if (!decoded) {
      if (redirectToLogin) {
        redirect("/auth/login");
      }
      return { user: null, profile: null, session: null, supabase };
    }

    // Get fresh user data from database
    const user = await getUserById(decoded.id);
    if (!user) {
      if (redirectToLogin) {
        redirect("/auth/login");
      }
      return { user: null, profile: null, session: null, supabase };
    }

    return { user, profile: user, session: { user }, supabase };
  } catch (error) {
    if (
      error?.digest?.startsWith('NEXT_REDIRECT') ||
      error?.digest === 'DYNAMIC_SERVER_USAGE' ||
      error?.message?.includes('Dynamic server usage') ||
      error?.message === 'NEXT_REDIRECT'
    ) {
      throw error;
    }
    console.error('Auth error in getSessionAndProfile:', error);
    if (redirectToLogin) {
      redirect("/auth/login");
    }
    return { user: null, profile: null, session: null, supabase };
  }
}

export async function requireApiSession(req) {
  const supabase = getSupabaseServiceClient();
  let token = null;

  if (req) {
    const authHeader = req.headers?.get ? req.headers.get('authorization') : req.headers?.authorization;
    token = authHeader?.replace('Bearer ', '') ||
      (req.cookies?.get ? req.cookies.get('auth-token')?.value : req.cookies?.['auth-token']);
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('auth-token')?.value;
    } catch (e) {
      // ignore
    }
  }

  if (!token) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  const user = await getUserById(decoded.id);
  if (!user) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  return {
    user,
    profile: user,
    session: { user },
    supabase
  };
}

export function assertInventoryManager(profile) {
  if (profile?.role !== "inventory_manager") {
    const error = new Error("Forbidden: inventory manager role required");
    error.status = 403;
    throw error;
  }
}
