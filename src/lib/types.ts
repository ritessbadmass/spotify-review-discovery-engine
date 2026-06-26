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
  | 'novelty_deficit' 
  | 'genre_mismatch' 
  | 'playlist_contamination' 
  | 'mood_context_mismatch' 
  | 'weak_long_tail_exploration' 
  | 'discovery_control_friction'
  | 'stale_recommendations' 
  | 'repeat_playlist_dependency' 
  | 'discover_weekly_repetition' 
  | 'same_artist_loop' 
  | 'language_loop' 
  | 'promoted_content_mistrust' 
  | 'poor_context_awareness' 
  | 'weak_user_control';

export type LikelySegment = 
  | 'active_music_explorer'
  | 'passive_routine_listener'
  | 'playlist_curator'
  | 'mood_based_listener'
  | 'niche_genre_seeker'
  | 'utility_background_listener'
  | 'free_tier_constrained_listener'
  | 'low_confidence'
  | 'repeat_playlist_listener' 
  | 'passive_discovery_user' 
  | 'bilingual_listener' 
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

export interface RootCauseSynthesis {
  userBehavior: string;
  systemFailure: string;
  businessImplication: string;
  opportunityArea: string;
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
  rootCauseSynthesis?: RootCauseSynthesis;
  provenance?: Provenance;
}

export interface PMSynthesis {
  topFrustrations: string[];
  topUnmetNeeds: string[];
  repetitiveDrivers: string[];
  segmentDifferences: string[];
}
