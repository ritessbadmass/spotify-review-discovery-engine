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
        answer: "Mock Answer: This is an AI generated response based on the analysis of the data and evidence supporting that answer. (GEMINI_API_KEY is not configured in this environment)",
        evidence: [
          "Mock quote showing an example of user feedback.",
          "Another mock quote indicating frustration."
        ]
      });
    }

    const aiResponse = await askQuestion(question, context);
    
    return NextResponse.json(aiResponse);
  } catch (err: any) {
    console.error('Ask API Error:', err);
    
    const errorMessage = err.message || err.toString() || '';
    
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({
        answer: "It looks like your Gemini API key has hit its free-tier rate limit (Too Many Requests). Please wait a minute before trying again. In the meantime, here is a mock response so you can see how the UI works!",
        evidence: [
          "Mock Quote: 'The algorithm keeps playing the same 5 songs over and over.'",
          "Mock Quote: 'I wish there was a way to reset my taste profile.'"
        ]
      });
    }

    return NextResponse.json({ error: errorMessage || 'Internal Server Error' }, { status: 500 });
  }
}
