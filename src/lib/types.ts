export type SourceType = 'app_store' | 'play_store' | 'reddit' | 'forum' | 'social';

export interface SourceItem {
  id: string;
  sourceType: SourceType;
  sourceUrl?: string;
  author: string;
  date: string;
  rawText: string;
  normalizedText: string;
  productName: string;
  language: string;
  region: string;
}

export interface DraftSourceItem extends SourceItem {
  isDuplicate?: boolean;
}

export type Sentiment = 'Positive' | 'Neutral' | 'Negative';
export type DiscoveryProblemType = 
  | 'stale_recommendations' 
  | 'repeat_playlist_dependency' 
  | 'discover_weekly_repetition' 
  | 'same_artist_loop' 
  | 'mood_mismatch' 
  | 'language_loop' 
  | 'promoted_content_mistrust' 
  | 'poor_context_awareness' 
  | 'weak_user_control';

export type LikelySegment = 
  | 'repeat_playlist_listener' 
  | 'passive_discovery_user' 
  | 'active_music_explorer' 
  | 'bilingual_listener' 
  | 'mood_based_listener' 
  | 'routine_listener' 
  | 'playlist_dependent_listener';

export type UserIntent = 
  | 'find_new_music' 
  | 'stay_in_current_mood' 
  | 'avoid_bad_recommendations' 
  | 'diversify_taste' 
  | 'regain_control' 
  | 'discover_by_context';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Provenance {
  status: 'live' | 'mock' | 'cached' | 'error';
  model?: string;
  cacheHit?: boolean;
}

export interface AnalysisResult {
  sourceItemId: string;
  sentiment: Sentiment;
  primaryTopic: string;
  secondaryTopics: string[];
  
  // Spotify-specific custom taxonomy
  discoveryProblemType: DiscoveryProblemType;
  repetitiveListeningSignal: boolean;
  userIntent: UserIntent;
  desiredOutcome: string;
  frustrationSeverity: Severity;
  likelySegment: LikelySegment;
  unmetNeed: string;
  
  // Metadata
  confidence: number;
  reasoning: string;

  provenance?: Provenance;
}

export interface InsightCluster {
  id: string;
  label: string;
  description: string;
  volume: number;
  severityAverage: string; // 'Low', 'Medium', 'High', 'Critical'
  sampleQuotes: string[];
  relatedSegments: LikelySegment[];
  relatedProblemTypes: DiscoveryProblemType[];
  sourceItemIdList: string[]; // For traceability
  sourceDistribution: Record<string, number>; // e.g. { 'app_store': 5, 'reddit': 2 }
  provenance?: Provenance;
}

export interface PMSynthesis {
  topFrustrations: string[];
  topUnmetNeeds: string[];
  repetitiveDrivers: string[];
  segmentDifferences: string[];
}
