import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken, getUserById } from "./auth-custom";

export async function getSessionAndProfile({ redirectToLogin = false } = {}) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken?.value) {
      if (redirectToLogin) {
        redirect("/auth/login");
      }
      return { user: null, profile: null };
    }

    // Verify token
    const decoded = verifyToken(authToken.value);
    if (!decoded) {
      if (redirectToLogin) {
        redirect("/auth/login");
      }
      return { user: null, profile: null };
    }

    // Get fresh user data from database
    const user = await getUserById(decoded.id);
    if (!user) {
      if (redirectToLogin) {
        redirect("/auth/login");
      }
      return { user: null, profile: null };
    }

    return { user, profile: user };
  } catch (error) {
    console.error('Auth error in getSessionAndProfile:', error);
    if (redirectToLogin) {
      redirect("/auth/login");
    }
    return { user: null, profile: null };
  }
}

export async function requireApiSession(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ||
    req.cookies.get('auth-token')?.value;

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

  return { user, profile: user };
}

export function assertInventoryManager(profile) {
  if (profile.role !== "inventory_manager") {
    throw new Error("Forbidden: inventory manager role required");
  }
}
