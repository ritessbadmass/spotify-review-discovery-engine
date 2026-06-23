import { NextResponse } from 'next/server';
import { liveAnalyze } from '@/lib/gemini';
import { readAnalysisCache, writeAnalysisCache, hashText } from '@/lib/serverCache';
import { analyzeItem as mockAnalyze } from '@/lib/analysisEngine';
import { SourceItem, AnalysisResult } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { items }: { items: SourceItem[] } = await request.json();
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const mode = process.env.NEXT_PUBLIC_ANALYSIS_MODE || 'mock';
    const provider = process.env.LLM_PROVIDER || 'mock';
    
    const isLive = mode === 'live' && provider === 'gemini';
    const cacheStore = readAnalysisCache();
    let cacheUpdated = false;

    const results: AnalysisResult[] = [];

    for (const item of items) {
      const hashKey = hashText(item.id, item.normalizedText);
      
      // 1. Check Cache
      if (isLive && cacheStore[hashKey]) {
        results.push({
          ...cacheStore[hashKey],
          provenance: { status: 'cached', model: 'gemini-2.5-flash', cacheHit: true }
        });
        continue;
      }

      // 2. Live API Call
      if (isLive && process.env.GEMINI_API_KEY) {
        try {
          const liveRes = await liveAnalyze(item);
          // Save to cache
          cacheStore[hashKey] = liveRes;
          cacheUpdated = true;
          
          results.push({
            ...liveRes,
            provenance: { status: 'live', model: 'gemini-2.5-flash', cacheHit: false }
          });
          continue;
        } catch (err) {
          console.warn(`Live analyze failed for ${item.id}, falling back to mock.`);
          // fallthrough to mock
        }
      }

      // 3. Fallback / Mock
      const mockRes = await mockAnalyze(item);
      results.push({
        ...mockRes,
        provenance: { status: 'mock', cacheHit: false }
      });
    }

    if (cacheUpdated) {
      writeAnalysisCache(cacheStore);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Analyze route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
