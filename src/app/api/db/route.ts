import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis only if keys are available
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN 
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

export async function GET(request: Request) {
  if (!redis) {
    return NextResponse.json({ items: null, analysis: null }, { status: 200 });
  }

  try {
    const items = await redis.get('spotify_mock_items');
    const analysis = await redis.get('spotify_mock_analysis');
    
    return NextResponse.json({ 
      items: items || null, 
      analysis: analysis || null 
    });
  } catch (error) {
    console.error('Error reading from Redis:', error);
    return NextResponse.json({ items: null, analysis: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!redis) {
    return NextResponse.json({ error: 'Redis is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { items, analysis } = body;

    if (items) {
      // 2000 items is a large payload, Upstash handles up to 1MB per request usually,
      // but we should set it properly.
      await redis.set('spotify_mock_items', items);
    }
    
    if (analysis) {
      await redis.set('spotify_mock_analysis', analysis);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to Redis:', error);
    return NextResponse.json({ error: 'Failed to write to Redis' }, { status: 500 });
  }
}
