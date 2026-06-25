import { GoogleGenAI, Type, Schema } from '@google/genai';
import { AnalysisResult, SourceItem, InsightCluster, PMSynthesis } from './types';

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

export async function liveAnalyze(item: SourceItem): Promise<AnalysisResult> {
  const aiInstance = getAI();
  if (!aiInstance) throw new Error('GEMINI_API_KEY is not configured');

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      sourceItemId: { type: Type.STRING },
      sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
      primaryTopic: { type: Type.STRING },
      secondaryTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
      discoveryProblemType: { 
        type: Type.STRING, 
        enum: [
          'stale_recommendations', 'repeat_playlist_dependency', 'discover_weekly_repetition',
          'same_artist_loop', 'mood_mismatch', 'language_loop', 'promoted_content_mistrust',
          'poor_context_awareness', 'weak_user_control'
        ] 
      },
      repetitiveListeningSignal: { type: Type.BOOLEAN },
      userIntent: { 
        type: Type.STRING, 
        enum: [
          'find_new_music', 'stay_in_current_mood', 'avoid_bad_recommendations', 
          'diversify_taste', 'regain_control', 'discover_by_context'
        ] 
      },
      desiredOutcome: { type: Type.STRING },
      frustrationSeverity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
      likelySegment: { 
        type: Type.STRING, 
        enum: [
          'repeat_playlist_listener', 'passive_discovery_user', 'active_music_explorer',
          'bilingual_listener', 'mood_based_listener', 'routine_listener', 'playlist_dependent_listener'
        ] 
      },
      unmetNeed: { type: Type.STRING },
      confidence: { type: Type.NUMBER },
      reasoning: { type: Type.STRING }
    },
    required: [
      'sourceItemId', 'sentiment', 'primaryTopic', 'secondaryTopics', 'discoveryProblemType',
      'repetitiveListeningSignal', 'userIntent', 'desiredOutcome', 'frustrationSeverity',
      'likelySegment', 'unmetNeed', 'confidence', 'reasoning'
    ]
  };

  const prompt = `
Analyze the following Spotify user review and extract structured insights.
You must adhere strictly to the JSON schema.
Source Item ID: ${item.id}
Text: "${item.normalizedText}"
  `;

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text) as AnalysisResult;
    
    // Safety fallback for sourceItemId
    if (parsed.sourceItemId !== item.id) parsed.sourceItemId = item.id;
    
    return parsed;
  } catch (err) {
    console.error('Gemini Live Analysis Error:', err);
    throw err;
  }
}

export async function liveCluster(evidence: any[]): Promise<InsightCluster[]> {
  const aiInstance = getAI();
  if (!aiInstance) throw new Error('GEMINI_API_KEY is not configured');

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        label: { type: Type.STRING },
        description: { type: Type.STRING },
        volume: { type: Type.NUMBER },
        severityAverage: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
        sampleQuotes: { type: Type.ARRAY, items: { type: Type.STRING } },
        relatedSegments: { type: Type.ARRAY, items: { type: Type.STRING } },
        relatedProblemTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
        sourceItemIdList: { type: Type.ARRAY, items: { type: Type.STRING } },
        sourceDistribution: { type: Type.OBJECT } // arbitrary KV for sources
      },
      required: [
        'id', 'label', 'description', 'volume', 'severityAverage', 'sampleQuotes',
        'relatedSegments', 'relatedProblemTypes', 'sourceItemIdList', 'sourceDistribution'
      ]
    }
  };

  const prompt = `
Given the following array of evidence objects (each representing a user review's analysis),
cluster them into 5 to 8 distinct insight themes.
Every cluster MUST be traceable to specific source item IDs provided in the evidence.
Do not create a cluster with no supporting items.
Output exactly as the JSON schema specifies.

Evidence Data:
${JSON.stringify(evidence, null, 2)}
  `;

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });

    const text = response.text || '';
    return JSON.parse(text) as InsightCluster[];
  } catch (err) {
    console.error('Gemini Live Cluster Error:', err);
    throw err;
  }
}

export async function askQuestion(question: string, context: InsightCluster[]): Promise<string> {
  const aiInstance = getAI();
  if (!aiInstance) throw new Error('GEMINI_API_KEY is not configured');

  const prompt = `
You are a highly analytical Product Manager AI assistant helping to interpret user feedback.
The user has asked the following question:
"${question}"

Below are several insight clusters derived from user reviews. Use this data as evidence to answer the user's question. 
Be concise, analytical, and directly quote or refer to the evidence when possible. Do not make up information that isn't supported by the clusters.

Context (Insight Clusters):
${JSON.stringify(context, null, 2)}
  `;

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    return response.text || 'No response generated.';
  } catch (err) {
    console.error('Gemini Live Ask Question Error:', err);
    throw err;
  }
}
