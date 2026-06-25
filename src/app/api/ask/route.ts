import { NextResponse } from 'next/server';
import { askQuestion } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { question, context } = await request.json();

    if (!question || !context) {
      return NextResponse.json({ error: 'Missing question or context' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      // For mock environments without an API key, return a mock response
      return NextResponse.json({ 
        answer: "Mock Answer: This is an AI generated response based on the analysis of the data and evidence supporting that answer. (GEMINI_API_KEY is not configured in this environment)" 
      });
    }

    const answer = await askQuestion(question, context);
    
    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error('Ask API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
