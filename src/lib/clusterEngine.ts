import { SourceItem, AnalysisResult, InsightCluster, PMSynthesis, DiscoveryProblemType, LikelySegment } from './types';

/**
 * FUTURE LLM CLUSTERING ARCHITECTURE:
 * 
 * 1. Embeddings & K-Means:
 *    - Generate text embeddings for every `AnalysisResult.reasoning` + `SourceItem.normalizedText`.
 *    - Run a fast clustering algorithm (e.g. DBSCAN or K-Means).
 * 2. LLM Summarization:
 *    - For each resulting cluster, pass the items into an LLM.
 *    - Prompt: "Given these 20 reviews that share a theme, generate a 1-sentence description and a 3-word label."
 * 3. Synthesis:
 *    - Pass ALL clusters to a final map-reduce LLM prompt to generate the `PMSynthesis`.
 */

export function generateClusters(items: SourceItem[], analysisMap: Record<string, AnalysisResult>): InsightCluster[] {
  // We use deterministic grouping based on problem type and segment for MVP
  const groups = new Map<string, { items: SourceItem[], results: AnalysisResult[] }>();

  items.forEach(item => {
    const res = analysisMap[item.id];
    if (!res) return;
    
    // Grouping logic: Combine problem type + a high-level bucket to form pseudo-clusters
    let groupKey: string = res.discoveryProblemType;
    if (res.discoveryProblemType === 'poor_context_awareness') groupKey = 'utility_conflict';
    if (res.discoveryProblemType === 'mood_mismatch') groupKey = 'mood_conflict';
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { items: [], results: [] });
    }
    groups.get(groupKey)!.items.push(item);
    groups.get(groupKey)!.results.push(res);
  });

  const clusters: InsightCluster[] = [];

  groups.forEach((data, key) => {
    if (data.items.length === 0) return;
    
    // Calculate severity average
    const severityScores = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
    const avgScore = data.results.reduce((sum, r) => sum + severityScores[r.frustrationSeverity], 0) / data.results.length;
    let avgSev = 'Medium';
    if (avgScore >= 3.5) avgSev = 'Critical';
    else if (avgScore >= 2.5) avgSev = 'High';
    else if (avgScore < 1.5) avgSev = 'Low';

    // Source distribution
    const sourceDist: Record<string, number> = {};
    data.items.forEach(i => {
      sourceDist[i.sourceType] = (sourceDist[i.sourceType] || 0) + 1;
    });

    // Unique segments and problem types
    const segments = Array.from(new Set(data.results.map(r => r.likelySegment || 'Unknown')));
    const problems = Array.from(new Set(data.results.map(r => r.discoveryProblemType || 'Unknown')));

    // Deterministic labels based on key
    let label = 'Algorithm Stagnation';
    let description = 'Users feel the algorithm is not providing enough novelty.';
    
    if (key === 'discover_weekly_repetition' || key === 'repeat_playlist_dependency') {
      label = 'The "Groundhog Day" Loop';
      description = 'Users feel trapped in a loop where discovery features just play their existing heavy rotation.';
    } else if (key === 'utility_conflict') {
      label = 'Utility vs. Taste Conflict';
      description = 'Temporary listening contexts (sleep, kids) are permanently distorting long-term personalization.';
    } else if (key === 'stale_recommendations' || key === 'language_loop') {
      label = 'Mainstream Gravity & Bubbles';
      description = 'Niche and bilingual listeners find that algorithms force them into generic pop or rigid language loops.';
    } else if (key === 'mood_conflict' || key === 'weak_user_control') {
      label = 'Loss of Vibe Control';
      description = 'Users want more control over how the algorithm interpolates their current mood or avoids specific content.';
    }

    clusters.push({
      id: `cluster-${key}`,
      label,
      description,
      volume: data.items.length,
      severityAverage: avgSev,
      sampleQuotes: data.items.slice(0, 3).map(i => i.rawText),
      relatedSegments: segments,
      relatedProblemTypes: problems,
      sourceItemIdList: data.items.map(i => i.id),
      sourceDistribution: sourceDist
    });
  });

  return clusters.sort((a, b) => b.volume - a.volume);
}

export function generateSynthesis(clusters: InsightCluster[]): PMSynthesis {
  // In a real app, this would be an LLM summarizing the clusters.
  // For the MVP, we aggregate deterministic insights based on the data.
  
  const hasUtility = clusters.some(c => c.label.includes('Utility'));
  const hasLoop = clusters.some(c => c.label.includes('Groundhog'));

  return {
    topFrustrations: [
      hasLoop ? "Algorithmic loops disguised as discovery features (e.g. Discover Weekly playing Liked Songs)." : "Lack of novel recommendations.",
      hasUtility ? "Taste profile contamination from sleep/kids playlists." : "Mainstream bias dominating niche genres.",
      "Inability to hard-reset recommendations or provide explicit negative feedback."
    ],
    topUnmetNeeds: [
      "Context-aware listening sessions that do not affect the permanent Taste Profile.",
      "A sliding scale for recommendation variance (Familiar vs. Completely New).",
      "Better guardrails to protect curated playlist vibes from Smart Shuffle pop injection."
    ],
    repetitiveDrivers: [
      "User resignation: Giving up on discovery and falling back to 'On Repeat'.",
      "Utility listening: Using Spotify as a white-noise or sleep tool.",
      "Algorithmic safety: The model over-indexing on high-completion tracks."
    ],
    segmentDifferences: [
      "Parents/Utility Users experience the most critical frustration due to total profile corruption.",
      "Active Explorers feel the most friction with Discover Weekly's lack of variance.",
      "Curators despise Smart Shuffle for ruining the specific aesthetic of their playlists."
    ]
  };
}
