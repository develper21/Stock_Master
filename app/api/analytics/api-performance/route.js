import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const performanceData = await request.json();
    
    // Validate the performance data
    if (!performanceData.endpoint || performanceData.duration === undefined) {
      return NextResponse.json(
        { error: 'Invalid performance data' },
        { status: 400 }
      );
    }

    // Log the performance data
    console.log('API Performance:', {
      endpoint: performanceData.endpoint,
      duration: performanceData.duration,
      success: performanceData.success,
      error: performanceData.error,
      timestamp: performanceData.timestamp,
    });

    // Store in database or send to monitoring service
    // For now, we'll just log it
    
    // You could store this in Supabase:
    /*
    const { data, error } = await supabase
      .from('api_performance')
      .insert({
        endpoint: performanceData.endpoint,
        duration: performanceData.duration,
        success: performanceData.success,
        error: performanceData.error,
        timestamp: performanceData.timestamp,
      });
    */

    // Send alerts for slow APIs
    if (performanceData.duration > 5000) {
      console.warn('SLOW API DETECTED:', performanceData);
      // Send alert to monitoring service
    }

    // Send alerts for failed APIs
    if (!performanceData.success) {
      console.error('API FAILURE:', performanceData);
      // Send alert to monitoring service
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing API performance:', error);
    return NextResponse.json(
      { error: 'Failed to store performance data' },
      { status: 500 }
    );
  }
}
