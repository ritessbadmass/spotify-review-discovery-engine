import { SourceItem, AnalysisResult, DiscoveryProblemType, LikelySegment, UserIntent, Sentiment, Severity } from './types';

/**
 * FUTURE LLM INTEGRATION PROMPT TEMPLATE
 * 
 * When plugging in a real LLM (like GPT-4 or Claude 3), use this system prompt:
 * 
 * SYSTEM PROMPT:
 * You are an expert Product Manager analyst specializing in Spotify's discovery algorithms.
 * Analyze the following user feedback and extract structured insights.
 * 
 * Output valid JSON matching this schema:
 * {
 *   "sentiment": "Positive" | "Neutral" | "Negative",
 *   "primaryTopic": string (e.g. "Discover Weekly", "Taste Profile"),
 *   "secondaryTopics": string[],
 *   "discoveryProblemType": "stale_recommendations" | "repeat_playlist_dependency" | "discover_weekly_repetition" | "same_artist_loop" | "mood_mismatch" | "language_loop" | "promoted_content_mistrust" | "poor_context_awareness" | "weak_user_control",
 *   "repetitiveListeningSignal": boolean,
 *   "userIntent": "find_new_music" | "stay_in_current_mood" | "avoid_bad_recommendations" | "diversify_taste" | "regain_control" | "discover_by_context",
 *   "desiredOutcome": string (What does the user ultimately want?),
 *   "frustrationSeverity": "Low" | "Medium" | "High" | "Critical",
 *   "likelySegment": "repeat_playlist_listener" | "passive_discovery_user" | "active_music_explorer" | "bilingual_listener" | "mood_based_listener" | "routine_listener" | "playlist_dependent_listener",
 *   "unmetNeed": string (What underlying product gap exists?),
 *   "confidence": number (0.0 to 1.0),
 *   "reasoning": string (1-2 sentences explaining why these labels were chosen based on the text)
 * }
 * 
 * USER MESSAGE:
 * {rawText}
 */

export async function analyzeItem(item: SourceItem): Promise<AnalysisResult> {
  // Simulate network/processing latency
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
  
  return deterministicMockAnalysis(item);
}

function deterministicMockAnalysis(item: SourceItem): AnalysisResult {
  const text = item.normalizedText.toLowerCase();

  // Defaults
  let sentiment: Sentiment = 'Neutral';
  let primaryTopic = 'General Discovery';
  let discoveryProblemType: DiscoveryProblemType = 'stale_recommendations';
  let likelySegment: LikelySegment = 'active_music_explorer';
  let userIntent: UserIntent = 'find_new_music';
  let repetitiveListeningSignal = false;
  let severity: Severity = 'Low';
  let reasoning = 'Default classification applied due to lack of specific keyword matches.';

  // Heuristics
  
  if (text.includes('frustrat') || text.includes('hate') || text.includes('annoy') || text.includes('ruin') || text.includes('worst')) {
    sentiment = 'Negative';
    severity = 'High';
  } else if (text.includes('love') || text.includes('great') || text.includes('amazing')) {
    sentiment = 'Positive';
  }

  if (text.includes('sleep') || text.includes('kids') || text.includes('white noise') || text.includes('baby')) {
    primaryTopic = 'Taste Profile Utility';
    discoveryProblemType = 'poor_context_awareness';
    likelySegment = 'routine_listener';
    userIntent = 'discover_by_context';
    repetitiveListeningSignal = true;
    severity = 'Critical';
    reasoning = 'Mention of utility audio (sleep/baby) implies the user wants context-aware profiles that do not permanently distort recommendations.';
  } 
  else if (text.includes('discover weekly') || text.includes('over and over') || text.includes('exact same')) {
    primaryTopic = 'Discover Weekly Algorithm';
    discoveryProblemType = 'discover_weekly_repetition';
    likelySegment = 'active_music_explorer';
    userIntent = 'diversify_taste';
    repetitiveListeningSignal = true;
    severity = 'High';
    reasoning = 'The user explicitly references repetition within discovery surfaces, suggesting an algorithmic loop.';
  }
  else if (text.includes('mood') || text.includes('vibe') || text.includes('gym') || text.includes('workout')) {
    primaryTopic = 'Contextual Playlists';
    discoveryProblemType = 'mood_mismatch';
    likelySegment = 'mood_based_listener';
    userIntent = 'stay_in_current_mood';
    reasoning = 'User mentions specific activities or moods (gym/vibe), indicating frustration when recommendations break that context.';
  }
  else if (text.includes('k-pop') || text.includes('language') || text.includes('spanish')) {
    primaryTopic = 'Language Bubbles';
    discoveryProblemType = 'language_loop';
    likelySegment = 'bilingual_listener';
    userIntent = 'regain_control';
    reasoning = 'Mentioning specific foreign genres/languages often leads to language loops due to rigid algorithmic tagging.';
  }
  else if (text.includes('mainstream') || text.includes('drake') || text.includes('taylor swift') || text.includes('pop hits')) {
    primaryTopic = 'Mainstream Bias';
    discoveryProblemType = 'stale_recommendations';
    likelySegment = 'active_music_explorer';
    userIntent = 'find_new_music';
    reasoning = 'User is complaining about the algorithm converging to highly popular artists regardless of seed track.';
  }
  else if (text.includes('radio') || text.includes('podcast')) {
    primaryTopic = 'Radio/Feed Mixing';
    discoveryProblemType = 'weak_user_control';
    likelySegment = 'passive_discovery_user';
    userIntent = 'avoid_bad_recommendations';
    repetitiveListeningSignal = true;
    reasoning = 'Mixing podcasts with music or playing heavy rotation on radio stations shows a lack of granular user control.';
  }
  else if (text.includes('on repeat') || text.includes('bubble') || text.includes('liked songs')) {
    primaryTopic = 'Filter Bubble';
    discoveryProblemType = 'repeat_playlist_dependency';
    likelySegment = 'repeat_playlist_listener';
    userIntent = 'diversify_taste';
    repetitiveListeningSignal = true;
    reasoning = 'Explicitly feeling trapped in a bubble or relying entirely on Liked Songs shows a breakdown in passive discovery mechanisms.';
  }

  // Generate mock confidence between 0.75 and 0.98
  const confidence = 0.75 + (Math.random() * 0.23);

  return {
    sourceItemId: item.id,
    sentiment,
    primaryTopic,
    secondaryTopics: [],
    discoveryProblemType,
    repetitiveListeningSignal,
    userIntent,
    desiredOutcome: 'Improved recommendation logic without manual curation',
    frustrationSeverity: severity,
    likelySegment,
    unmetNeed: 'Contextual awareness and taste boundary controls',
    confidence,
    reasoning
  };
}
