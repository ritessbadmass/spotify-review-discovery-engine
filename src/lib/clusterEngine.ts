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
    if (res.discoveryProblemType === 'poor_context_awareness') groupKey = 'context_conflict';
    if (res.discoveryProblemType === 'mood_context_mismatch') groupKey = 'mood_conflict';
    if (res.discoveryProblemType === 'playlist_contamination') groupKey = 'curation_conflict';
    if (res.discoveryProblemType === 'weak_long_tail_exploration' || res.discoveryProblemType === 'novelty_deficit') groupKey = 'stagnation';
    if (res.discoveryProblemType === 'genre_mismatch') groupKey = 'genre_conflict';
    if (res.discoveryProblemType === 'discovery_control_friction') groupKey = 'control_friction';
    
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
    const segments = Array.from(new Set(data.results.map(r => r.likelySegment || 'low_confidence')));
    const problems = Array.from(new Set(data.results.map(r => r.discoveryProblemType || 'unknown')));

    // Deterministic labels based on key
    let label = 'Algorithm Stagnation';
    let description = 'Users feel the algorithm is not providing enough novelty.';
    let rootCauseSynthesis = {
      userBehavior: 'Users actively seeking new music hit a dead end.',
      systemFailure: 'Recommender over-indexes on familiar top hits rather than exploring the long tail.',
      businessImplication: 'Churn among music enthusiasts who seek variety.',
      opportunityArea: 'Session-level novelty boosters.'
    };
    
    if (key === 'discover_weekly_repetition' || key === 'repeat_playlist_dependency') {
      label = 'The "Groundhog Day" Loop';
      description = 'Users feel trapped in a loop where discovery features just play their existing heavy rotation.';
      rootCauseSynthesis = {
        userBehavior: 'Users expect Discover Weekly to find new music but hear the same artists.',
        systemFailure: 'Algorithm conflates high-completion repeat listening with discovery preference.',
        businessImplication: 'Loss of trust in personalized playlists, reduced daily active usage for discovery.',
        opportunityArea: 'Hard-filter out recent heavily-played artists from discovery surfaces.'
      };
    } else if (key === 'context_conflict') {
      label = 'Utility vs. Taste Conflict';
      description = 'Temporary listening contexts (sleep, kids, background) are permanently distorting long-term personalization.';
      rootCauseSynthesis = {
        userBehavior: 'Users play white noise, lo-fi, or kids music for functional reasons.',
        systemFailure: 'System lacks a way to compartmentalize context-specific play history from core taste profile.',
        businessImplication: 'Core recommendations become unusable, forcing users to build manual workarounds.',
        opportunityArea: 'Contextual sandbox or "do not track" session toggle.'
      };
    } else if (key === 'stale_recommendations' || key === 'stagnation' || key === 'language_loop') {
      label = 'Mainstream Gravity & Bubbles';
      description = 'Niche and bilingual listeners find that algorithms force them into generic pop or rigid language loops.';
      rootCauseSynthesis = {
        userBehavior: 'Users branch out to a niche genre but get quickly pulled back to mainstream pop.',
        systemFailure: 'Collaborative filtering struggles with sparse niche data and defaults to popular adjacent tracks.',
        businessImplication: 'Failure to retain diverse global audiences or specialized listeners.',
        opportunityArea: 'Deep-dive recommendation parameters for niche exploration.'
      };
    } else if (key === 'curation_conflict') {
      label = 'Playlist Contamination';
      description = 'Automated additions (like Smart Shuffle) are ruining the carefully curated vibes of user playlists.';
      rootCauseSynthesis = {
        userBehavior: 'Users carefully build playlists with a specific aesthetic but the app injects jarring songs.',
        systemFailure: 'Smart Shuffle prioritizes genre/tempo matching over aesthetic or lyrical cohesion.',
        businessImplication: 'Power users (curators) feel alienated and turn off engagement features.',
        opportunityArea: 'Playlist-safe discovery layer with strict vibe constraints.'
      };
    } else if (key === 'control_friction' || key === 'mood_conflict' || key === 'weak_user_control') {
      label = 'Loss of Vibe Control';
      description = 'Users want more control over how the algorithm interpolates their current mood or avoids specific content.';
      rootCauseSynthesis = {
        userBehavior: 'Users try to steer the algorithm but find "Not Interested" or skipping ineffective.',
        systemFailure: 'Negative feedback loops are weak and non-transparent, failing to instantly correct recommendations.',
        businessImplication: 'Immediate session abandonment when the vibe is ruined.',
        opportunityArea: 'Smarter negative feedback loop and explicit session controls.'
      };
    } else {
      // Dynamic fallback for any other problem types
      const cleanKey = key.replace(/_/g, ' ');
      label = cleanKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      description = `Users are experiencing strong friction related to ${cleanKey}.`;
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
      sourceDistribution: sourceDist,
      rootCauseSynthesis
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
