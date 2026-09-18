import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const vital = await request.json();
    
    // Validate the vital data
    if (!vital.name || !vital.value) {
      return NextResponse.json(
        { error: 'Invalid vital data' },
        { status: 400 }
      );
    }

    // Log the vital (in production, send to analytics service)
    console.log('Web Vital Received:', {
      name: vital.name,
      value: vital.value,
      id: vital.id,
      url: vital.url,
      timestamp: new Date().toISOString(),
    });

    // Store in database or send to analytics service
    // For now, we'll just log it
    
    // You could store this in Supabase:
    /*
    const { data, error } = await supabase
      .from('web_vitals')
      .insert({
        name: vital.name,
        value: vital.value,
        id: vital.id,
        url: vital.url,
        timestamp: new Date().toISOString(),
      });
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing web vital:', error);
    return NextResponse.json(
      { error: 'Failed to store vital' },
      { status: 500 }
    );
  }
}
