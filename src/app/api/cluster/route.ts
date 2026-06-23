import { NextResponse } from 'next/server';
import { liveCluster } from '@/lib/gemini';
import { readClusterCache, writeClusterCache, hashClusterEvidence } from '@/lib/serverCache';
import { generateClusters as mockCluster } from '@/lib/clusterEngine';
import { SourceItem, AnalysisResult, InsightCluster } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { items, analysisMap }: { items: SourceItem[], analysisMap: Record<string, AnalysisResult> } = await request.json();
    
    if (!items || !analysisMap) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const mode = process.env.NEXT_PUBLIC_ANALYSIS_MODE || 'mock';
    const provider = process.env.LLM_PROVIDER || 'mock';
    const isLive = mode === 'live' && provider === 'gemini';

    // 1. Prepare evidence format
    const evidence = items.map(item => {
      const res = analysisMap[item.id];
      if (!res) return null;
      return {
        id: item.id,
        discoveryProblemType: res.discoveryProblemType,
        likelySegment: res.likelySegment,
        unmetNeed: res.unmetNeed,
        sampleQuote: item.rawText
      };
    }).filter(Boolean);

    const hashKey = hashClusterEvidence(evidence);
    const cacheStore = readClusterCache();

    // 2. Check Cache
    if (isLive && cacheStore[hashKey]) {
      const cached = cacheStore[hashKey].map(c => ({
        ...c,
        provenance: { status: 'cached', model: 'gemini-2.5-flash', cacheHit: true } as const
      }));
      return NextResponse.json({ clusters: cached });
    }

    // 3. Live API Call
    if (isLive && process.env.GEMINI_API_KEY) {
      try {
        const liveRes = await liveCluster(evidence);
        
        // Save to cache
        cacheStore[hashKey] = liveRes;
        writeClusterCache(cacheStore);

        const finalRes = liveRes.map(c => ({
          ...c,
          provenance: { status: 'live', model: 'gemini-2.5-flash', cacheHit: false } as const
        }));

        return NextResponse.json({ clusters: finalRes });
      } catch (err) {
        console.warn('Live clustering failed, falling back to mock.');
      }
    }

    // 4. Fallback / Mock
    const mockRes = mockCluster(items, analysisMap);
    const finalRes = mockRes.map(c => ({
      ...c,
      provenance: { status: 'mock', cacheHit: false } as const
    }));
    
    return NextResponse.json({ clusters: finalRes });

  } catch (error) {
    console.error('Cluster route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
