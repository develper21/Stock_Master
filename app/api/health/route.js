import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Basic health check
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      },
      services: {
        database: 'checking...',
        email: 'checking...',
      },
    };

    // Check database connectivity (if you have a health check endpoint)
    try {
      const dbCheck = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      });
      healthCheck.services.database = dbCheck.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
    }

    // Check email service (basic check)
    healthCheck.services.email = process.env.SMTP_HOST ? 'configured' : 'not configured';

    // Return appropriate status based on health
    const isHealthy = Object.values(healthCheck.services).every(
      service => service === 'healthy' || service === 'configured'
    );

    return NextResponse.json(healthCheck, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}
