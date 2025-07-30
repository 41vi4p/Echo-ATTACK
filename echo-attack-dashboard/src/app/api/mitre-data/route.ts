import { NextResponse } from 'next/server';
import { mitreLoader } from '@/lib/data-loader';

export async function GET() {
  try {
    // Load APT groups data
    const aptGroups = await mitreLoader.loadAPTGroups();
    
    // Calculate overview metrics
    const metrics = mitreLoader.calculateOverviewMetrics(aptGroups);
    
    return NextResponse.json({
      aptGroups,
      metrics,
      timestamp: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    console.error('Error loading MITRE data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to load MITRE data',
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}