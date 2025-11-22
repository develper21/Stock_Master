import { NextResponse } from "next/server";

export function jsonError(error, status = 400) {
  const message = typeof error === "string" ? error : error?.message || "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess(data, init = {}) {
  return NextResponse.json(data, init);
}

export function handleRouteError(error) {
  console.error(error);
  const status = error?.status || 500;
  const message = error?.message || "Internal server error";
  return jsonError(message, status);
}
