import { SourceItem, AnalysisResult, InsightCluster, PMSynthesis } from './types';
import { mockSourceItems } from './mockData';
import { analyzeItem } from './analysisEngine';
import { generateClusters, generateSynthesis } from './clusterEngine';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let cachedItems: SourceItem[] | null = null;
let cachedAnalysis: Record<string, AnalysisResult> | null = null;

// Manage data via Vercel KV DB, with fallback to localStorage
async function getStoredItems(): Promise<SourceItem[]> {
  if (cachedItems) return cachedItems;
  if (typeof window === 'undefined') return mockSourceItems;
  
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const data = await res.json();
      if (data.items) {
        cachedItems = data.items;
        return data.items;
      }
    }
  } catch (err) {
    console.error('Failed to fetch items from DB', err);
  }

  const stored = localStorage.getItem('spotify_mock_items');
  if (stored) {
    try { 
      const parsed = JSON.parse(stored);
      cachedItems = parsed;
      return parsed;
    } catch (e) { console.error(e); }
  }
  localStorage.setItem('spotify_mock_items', JSON.stringify(mockSourceItems));
  return mockSourceItems;
}

async function getStoredAnalysis(): Promise<Record<string, AnalysisResult>> {
  if (cachedAnalysis) return cachedAnalysis;
  if (typeof window === 'undefined') return {};
  
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const data = await res.json();
      if (data.analysis) {
        cachedAnalysis = data.analysis;
        return data.analysis;
      }
    }
  } catch (err) {
    console.error('Failed to fetch analysis from DB', err);
  }

  const stored = localStorage.getItem('spotify_mock_analysis');
  if (stored) {
    try { 
      const parsed = JSON.parse(stored);
      cachedAnalysis = parsed;
      return parsed; 
    } catch (e) { console.error(e); }
  }
  return {};
}

async function saveStoredAnalysis(map: Record<string, AnalysisResult>) {
  cachedAnalysis = map;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('spotify_mock_analysis', JSON.stringify(map));
    } catch (e) {
      console.warn('localStorage quota exceeded for analysis, relying on memory/Redis cache.', e);
    }
    try {
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: map })
      });
    } catch (e) {}
  }
}

// Helper to batch process through API
async function processBatchAPI(items: SourceItem[]): Promise<AnalysisResult[]> {
  const mode = process.env.NEXT_PUBLIC_ANALYSIS_MODE || 'mock';
  if (mode === 'live') {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
    } catch (err) {
      console.error('API analyze error', err);
    }
  }

  // Fallback to local mock if not live or if API fails
  const results: AnalysisResult[] = await Promise.all(items.map(item => analyzeItem(item)));
  return results.map(r => ({ ...r, provenance: { status: 'mock' } as any }));
}

let seedAnalysisPromise: Promise<void> | null = null;

// Ensure seeded items have analysis on first load
async function ensureSeedAnalysis() {
  if (typeof window === 'undefined') return;
  if (seedAnalysisPromise) return seedAnalysisPromise;

  seedAnalysisPromise = (async () => {
    const analysisMap = await getStoredAnalysis();
    
    const missingItems = mockSourceItems.filter(item => !analysisMap[item.id]);
    
    if (missingItems.length > 0) {
      // Process missing items in batches
      const batchSize = 3;
      for (let i = 0; i < missingItems.length; i += batchSize) {
        const batch = missingItems.slice(i, i + batchSize);
        const results = await processBatchAPI(batch);
        for (const res of results) {
          analysisMap[res.sourceItemId] = res;
        }
        // Add a small delay between batches
        if (i + batchSize < missingItems.length) await delay(1000);
      }
      await saveStoredAnalysis(analysisMap);
    }
  })();

  return seedAnalysisPromise;
}

export async function getDashboardStats() {
  await ensureSeedAnalysis();
  await delay(800);
  const items = await getStoredItems();
  const analysisMap = await getStoredAnalysis();
  const totalReviews = items.length;
  
  const results = items.map(i => analysisMap[i.id]).filter(Boolean);
  const negativeReviews = results.filter(r => r.sentiment === 'Negative').length;
  
  const problemCounts = results.reduce((acc, curr) => {
    acc[curr.discoveryProblemType] = (acc[curr.discoveryProblemType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topProblem = Object.keys(problemCounts).length > 0 
    ? Object.keys(problemCounts).reduce((a, b) => problemCounts[a] > problemCounts[b] ? a : b)
    : 'Unknown';

  const segmentCounts = results.reduce((acc, curr) => {
    const seg = curr.likelySegment || 'low_confidence';
    if (seg !== 'low_confidence') {
      acc[seg] = (acc[seg] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topSegment = Object.keys(segmentCounts).length > 0
    ? Object.keys(segmentCounts).reduce((a, b) => segmentCounts[a] > segmentCounts[b] ? a : b)
    : 'low_confidence';

  const provenance = {
    total: results.length,
    mock: results.filter(r => r.provenance?.status === 'mock').length,
    live: results.filter(r => r.provenance?.status === 'live').length,
    cached: results.filter(r => r.provenance?.status === 'cached').length,
    sources: items.reduce((acc, curr) => {
      acc[curr.sourceType] = (acc[curr.sourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    confidenceAverage: Math.round(results.reduce((sum, r) => sum + (r.confidence || 0), 0) / Math.max(results.length, 1) * 100) / 100
  };

  return {
    totalReviews,
    negativeFeedbackPercentage: Math.round((negativeReviews / Math.max(totalReviews, 1)) * 100),
    topProblem: topProblem.replace(/_/g, ' '),
    topSegment: topSegment.replace(/_/g, ' '),
    topUnmetNeed: 'Contextual awareness and taste boundary controls',
    provenance
  };
}

export async function getReviews(): Promise<(SourceItem & { analysis?: AnalysisResult })[]> {
  await ensureSeedAnalysis();
  await delay(1000);
  const items = await getStoredItems();
  const analysisMap = await getStoredAnalysis();
  return items.map(item => ({
    ...item,
    analysis: analysisMap[item.id]
  }));
}

export async function getReviewById(id: string): Promise<(SourceItem & { analysis?: AnalysisResult }) | null> {
  await delay(500);
  const items = await getStoredItems();
  const item = items.find(i => i.id === id);
  if (!item) return null;
  const analysisMap = await getStoredAnalysis();
  return {
    ...item,
    analysis: analysisMap[id]
  };
}

export async function getInsightClusters(): Promise<InsightCluster[]> {
  await ensureSeedAnalysis();
  const items = await getStoredItems();
  const analysisMap = await getStoredAnalysis();
  
  const mode = process.env.NEXT_PUBLIC_ANALYSIS_MODE || 'mock';
  if (mode === 'live') {
    try {
      const res = await fetch('/api/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, analysisMap })
      });
      if (res.ok) {
        const data = await res.json();
        return data.clusters || [];
      }
    } catch (err) {
      console.error('API cluster error', err);
    }
  }

  // Fallback
  return generateClusters(items, analysisMap);
}

export async function getSynthesis(): Promise<PMSynthesis> {
  const clusters = await getInsightClusters();
  return generateSynthesis(clusters);
}

export async function ingestText(text: string): Promise<AnalysisResult> {
  // Used in simple ingest page
  const tempItem: SourceItem = {
    id: `temp-${Date.now()}`,
    sourceType: 'social',
    author: 'Test User',
    date: new Date().toISOString().split('T')[0],
    rawText: text,
    normalizedText: text,
    productName: 'Spotify App',
    language: 'en',
    region: 'US'
  };
  return await analyzeItem(tempItem);
}

export async function bulkIngest(newItems: SourceItem[], onProgress?: (done: number, total: number) => void): Promise<void> {
  if (typeof window !== 'undefined') {
    const existing = await getStoredItems();
    const merged = [...newItems, ...existing];
    
    cachedItems = merged;
    try {
      localStorage.setItem('spotify_mock_items', JSON.stringify(merged));
    } catch (e) {
      console.warn('localStorage quota exceeded for items, relying on memory/Redis cache.', e);
    }
    
    // Sync items to DB in background
    try {
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: merged })
      });
    } catch (e) {}

    const analysisMap = await getStoredAnalysis();
    
    // Process in batches
    const batchSize = 3;
    for (let i = 0; i < newItems.length; i += batchSize) {
      if (onProgress) onProgress(i, newItems.length);
      const batch = newItems.slice(i, i + batchSize);
      const results = await processBatchAPI(batch);
      for (const res of results) {
        analysisMap[res.sourceItemId] = res;
      }
      if (i + batchSize < newItems.length) await delay(1000);
    }
    if (onProgress) onProgress(newItems.length, newItems.length);
    
    await saveStoredAnalysis(analysisMap);
  }
}

export async function reanalyzeItems(itemIds: string[]): Promise<void> {
  if (typeof window !== 'undefined') {
    const items = await getStoredItems();
    const analysisMap = await getStoredAnalysis();
    
    const itemsToProcess = itemIds.map(id => items.find(i => i.id === id)).filter(Boolean) as SourceItem[];
    
    const batchSize = 3;
    for (let i = 0; i < itemsToProcess.length; i += batchSize) {
      const batch = itemsToProcess.slice(i, i + batchSize);
      const results = await processBatchAPI(batch);
      for (const res of results) {
        analysisMap[res.sourceItemId] = res;
      }
      if (i + batchSize < itemsToProcess.length) await delay(1000);
    }
    
    await saveStoredAnalysis(analysisMap);
  }
}

export async function fetchExistingItems(): Promise<SourceItem[]> {
  return await getStoredItems();
}
