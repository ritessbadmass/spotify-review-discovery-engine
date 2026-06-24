import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';
import { GoogleGenAI } from '@google/genai';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN 
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROMPT_TEMPLATE = `
You are an expert UX Researcher. Analyze the following user review.

Respond ONLY with a valid JSON object matching this schema:
{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "discoveryProblemType": "relevance" | "repetition" | "echo_chamber" | "ui_ux" | "algorithm_transparency" | "none",
  "keyQuotes": ["quote 1"],
  "unmetNeed": "String describing what the user actually wants"
}

Review:
"{text}"
`;

async function analyzeWithGemini(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: PROMPT_TEMPLATE.replace('{text}', text),
      config: {
        responseMimeType: "application/json",
      }
    });
    
    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed;
    }
  } catch (err) {
    console.error('Gemini error:', err);
  }
  
  // Fallback
  return {
    sentiment: "Neutral",
    discoveryProblemType: "none",
    keyQuotes: [],
    unmetNeed: "Could not parse"
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  if (!redis) {
    console.error('Missing Upstash Redis keys in .env.local!');
    return;
  }
  
  const csvPath = path.join(process.cwd(), 'data', 'scraped-reviews.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('No scraped-reviews.csv found!');
    return;
  }
  
  console.log('Loading CSV...');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const items = parsed.data as any[];
  
  console.log(`Found ${items.length} reviews. Syncing items to Redis...`);
  
  // Convert CSV strings back to proper types if needed, but they are just strings mostly
  await redis.set('spotify_mock_items', items);
  
  console.log('Items synced. Starting Gemini Analysis (this will take a while)...');
  
  const analysisMap: Record<string, any> = {};
  
  // Batch process
  const batchSize = 10;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Analyzing batch ${i / batchSize + 1} of ${Math.ceil(items.length / batchSize)}...`);
    
    const promises = batch.map(async (item) => {
      const result = await analyzeWithGemini(item.normalizedText || item.rawText);
      analysisMap[item.id] = {
        sourceItemId: item.id,
        ...result,
        provenance: { status: 'live', timestamp: new Date().toISOString() }
      };
    });
    
    await Promise.all(promises);
    
    // Save checkpoint every batch to prevent data loss
    await redis.set('spotify_mock_analysis', analysisMap);
    
    // Rate limit protection
    await delay(2000); 
  }
  
  console.log('Analysis completely finished and saved to Cloud Database!');
}

main().catch(console.error);
