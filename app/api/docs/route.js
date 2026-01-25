import { NextResponse } from 'next/server';
import { specs } from '@/lib/api-docs';

export async function GET() {
  return NextResponse.json(specs, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
