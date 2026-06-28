/**
 * seed-redis.js
 * 
 * Fetches all items from mock-scrape, runs the local analysis engine
 * on each item, and saves BOTH items + analysis to Redis with matching IDs.
 * 
 * This ensures the dashboard can join items to their analysis by ID.
 */
const { Redis } = require('@upstash/redis');
require('dotenv').config({ path: '.env.local' });

// Inline the analysis engine logic (since it's TypeScript, we replicate the pure JS version)
function analyzeItem(item) {
  const text = (item.normalizedText || item.rawText || '').toLowerCase();

  const negativeWords = ['frustrat', 'hate', 'annoy', 'ruin', 'worst', 'stupid', 'dumb', 'useless', 'broken', 'fail', 'suck', 'bad', 'terrible', 'horrible', 'garbage', 'trash', 'disappoint'];
  const positiveWords = ['love', 'great', 'amazing', 'best', 'awesome', 'perfect', 'favorite', 'good', 'excellent', 'fantastic', 'cool', 'brilliant'];

  const utilityWords = ['sleep', 'kids', 'white noise', 'baby', 'study', 'focus', 'work', 'background', 'rain', 'lullaby'];
  const noveltyWords = ['discover weekly', 'over and over', 'exact same', 'tired', 'bored', 'repetitive', 'stale', 'same songs', 'loop', 'refresh', 'new music'];
  const moodWords = ['mood', 'vibe', 'gym', 'workout', 'party', 'chill', 'relax', 'sad', 'happy', 'energy', 'hype', 'drive', 'driving'];
  const nicheWords = ['k-pop', 'language', 'spanish', 'anime', 'metal', 'jazz', 'classical', 'indie', 'obscure', 'foreign', 'korean', 'japanese'];
  const mainstreamWords = ['mainstream', 'drake', 'taylor swift', 'pop hits', 'radio', 'popular', 'charts', 'top 50', 'billboard', 'rap', 'hip hop'];
  const curationWords = ['smart shuffle', 'ruins the vibe', 'curated', 'my playlist', 'added', 'remove', 'stop adding', 'leave my playlist alone', 'algorithm'];

  let sentiment = 'Neutral';
  let severity = 'Low';

  let negScore = negativeWords.filter(w => text.includes(w)).length;
  let posScore = positiveWords.filter(w => text.includes(w)).length;

  if (negScore > posScore) {
    sentiment = 'Negative';
    severity = negScore > 2 ? 'Critical' : (negScore === 2 ? 'High' : 'Medium');
  } else if (posScore > negScore) {
    sentiment = 'Positive';
  } else if (text.length > 100 && negScore === 0 && posScore === 0) {
    sentiment = 'Neutral';
    severity = 'Medium';
  }

  const scores = {
    utility: utilityWords.filter(w => text.includes(w)).length,
    novelty: noveltyWords.filter(w => text.includes(w)).length,
    mood: moodWords.filter(w => text.includes(w)).length,
    niche: nicheWords.filter(w => text.includes(w)).length,
    mainstream: mainstreamWords.filter(w => text.includes(w)).length,
    curation: curationWords.filter(w => text.includes(w)).length,
  };

  const maxCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

  let primaryTopic = 'Algorithmic Discovery';
  let discoveryProblemType = 'stale_recommendations';
  let likelySegment = 'passive_discovery_user';
  let userIntent = 'find_new_music';
  let repetitiveListeningSignal = false;
  let unmetNeed = 'More transparent algorithm controls';
  let reasoning = 'Generated via Advanced Local NLP Heuristics.';

  if (scores[maxCategory] > 0) {
    switch (maxCategory) {
      case 'utility':
        primaryTopic = 'Taste Profile Contamination';
        discoveryProblemType = 'mood_context_mismatch';
        likelySegment = 'routine_listener';
        userIntent = 'discover_by_context';
        repetitiveListeningSignal = true;
        unmetNeed = 'Ability to exclude utility listening from permanent taste profile.';
        reasoning = `The user's mention of utility/background listening (${utilityWords.find(w => text.includes(w)) || 'sleep/focus'}) indicates their algorithm is being permanently skewed by non-active listening sessions.`;
        break;
      case 'novelty':
        primaryTopic = 'Discover Weekly Fatigue';
        discoveryProblemType = 'discover_weekly_repetition';
        likelySegment = 'active_music_explorer';
        userIntent = 'diversify_taste';
        repetitiveListeningSignal = true;
        unmetNeed = 'A mechanism to force-refresh or hard-reset the discovery algorithm.';
        reasoning = `Explicit frustration with repeating tracks (keywords like "${noveltyWords.find(w => text.includes(w)) || 'repetitive'}") in discovery surfaces intended for new music.`;
        break;
      case 'mood':
        primaryTopic = 'Contextual Playlists';
        discoveryProblemType = 'mood_context_mismatch';
        likelySegment = 'mood_based_listener';
        userIntent = 'stay_in_current_mood';
        unmetNeed = 'Stricter boundary controls for mood-based algorithmic playlists.';
        reasoning = `User expects the algorithm to respect temporal moods or activity contexts (e.g. ${moodWords.find(w => text.includes(w)) || 'gym/vibe'}). Recommendations are currently breaking this boundary.`;
        break;
      case 'niche':
        primaryTopic = 'Language & Niche Bubbles';
        discoveryProblemType = 'same_artist_loop';
        likelySegment = 'bilingual_listener';
        userIntent = 'regain_control';
        unmetNeed = 'Better cross-pollination between niche/foreign genres and mainstream tastes.';
        reasoning = `Listening to specific niche genres (${nicheWords.find(w => text.includes(w)) || 'foreign language'}) is trapping the user in a localized filter bubble with high repetition.`;
        break;
      case 'mainstream':
        primaryTopic = 'Mainstream Bias';
        discoveryProblemType = 'weak_long_tail_exploration';
        likelySegment = 'active_music_explorer';
        userIntent = 'avoid_bad_recommendations';
        unmetNeed = 'Adjustable weights to favor obscure/indie artists over top 40 hits in radio.';
        reasoning = `User is annoyed that algorithmic radio constantly gravitates toward massive pop hits (${mainstreamWords.find(w => text.includes(w)) || 'mainstream'}) regardless of the seed track.`;
        break;
      case 'curation':
        primaryTopic = 'Playlist Curation Friction';
        discoveryProblemType = 'weak_user_control';
        likelySegment = 'playlist_dependent_listener';
        userIntent = 'regain_control';
        unmetNeed = 'Opt-out features for Smart Shuffle and automated playlist injections.';
        reasoning = `Strong negative sentiment toward automated features (${curationWords.find(w => text.includes(w)) || 'smart shuffle'}) altering manually curated playlists.`;
        break;
    }
  } else {
    if (text.length > 150) {
      primaryTopic = 'Recommendation Monotony';
      discoveryProblemType = 'repeat_playlist_dependency';
      likelySegment = 'repeat_playlist_listener';
      userIntent = 'diversify_taste';
      repetitiveListeningSignal = true;
      unmetNeed = 'Gradual introduction of novelty into familiar playlists.';
      reasoning = `Detailed feedback (${text.length} characters) points to a general fatigue with the recommendation engine loop and a desire for gradual novelty.`;
    } else {
      primaryTopic = 'General Discovery Friction';
      discoveryProblemType = 'stale_recommendations';
      likelySegment = 'passive_discovery_user';
      userIntent = 'find_new_music';
      unmetNeed = 'Simple, one-tap ways to steer daily recommendations.';
      reasoning = `Concise feedback (${text.length} chars) mapped to the largest general passive user segment experiencing stale recommendations.`;
    }
  }

  const confidence = Math.min(0.99, 0.85 + (text.length / 1000));

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
    unmetNeed,
    confidence,
    reasoning,
    provenance: { status: 'mock' }
  };
}

async function main() {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  console.log('Fetching items from local dev server...');
  const res = await fetch('http://localhost:3000/api/mock-scrape');
  if (!res.ok) throw new Error(`mock-scrape returned ${res.status}`);
  const data = await res.json();
  const items = data.items;
  console.log(`Loaded ${items.length} items.`);

  // Analyze every item locally
  console.log('Running local analysis engine on all items...');
  const analysisMap = {};
  for (const item of items) {
    const result = analyzeItem(item);
    analysisMap[item.id] = result;
  }
  console.log(`Analyzed ${Object.keys(analysisMap).length} items.`);

  // Verify IDs match
  const sampleItem = items[0];
  const sampleAnalysis = analysisMap[sampleItem.id];
  console.log(`\nID match check:`);
  console.log(`  Item ID:    ${sampleItem.id}`);
  console.log(`  Analysis key: ${sampleAnalysis.sourceItemId}`);
  console.log(`  Match: ${sampleItem.id === sampleAnalysis.sourceItemId}`);

  // Save both to Redis
  console.log('\nSaving items to Redis...');
  await redis.set('spotify_mock_items', items);
  console.log('Saving analysis to Redis...');
  await redis.set('spotify_mock_analysis', analysisMap);

  console.log(`\n✅ Done! ${items.length} items and ${Object.keys(analysisMap).length} analyses saved with matching IDs.`);
}

main().catch(console.error);
