const { Redis } = require('@upstash/redis');
require('dotenv').config({ path: '.env.local' });

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  console.log('Fetching mock items from dev server API...');
  const scrapeRes = await fetch('http://localhost:3000/api/mock-scrape');
  
  if (!scrapeRes.ok) {
    throw new Error(`Failed to fetch mock-scrape: ${scrapeRes.status}`);
  }
  
  const data = await scrapeRes.json();
  const items = data.items;
  console.log(`Loaded ${items.length} items to process.`);
  
  // Save all items to redis immediately
  await redis.set('spotify_mock_items', JSON.stringify(items));
  console.log('Saved items dataset to Redis.');
  
  // Fetch existing analysis to resume if needed
  let analysisMapRaw = await redis.get('spotify_mock_analysis');
  let analysisMap = {};
  if (analysisMapRaw) {
    analysisMap = typeof analysisMapRaw === 'string' ? JSON.parse(analysisMapRaw) : analysisMapRaw;
  }
  
  let unanalyzed = items.filter(i => !analysisMap[i.id]);
  console.log(`${unanalyzed.length} items remain to be analyzed by Gemini.`);
  
  const batchSize = 3;
  let saveCounter = 0;
  let consecutiveRateLimits = 0;

  for (let i = 0; i < unanalyzed.length; i += batchSize) {
    if (consecutiveRateLimits >= 3) {
      console.log('Daily Rate Limit likely reached (multiple consecutive mock fallbacks). Halting script. Please run again tomorrow!');
      break;
    }
    const batch = unanalyzed.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(unanalyzed.length / batchSize)}`);
    
    try {
      const res = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: batch })
      });
      
      if (res.ok) {
        const body = await res.json();
        let anyLive = false;
        for (const result of body.results) {
           // Only keep live results to ensure quality
           if (result.provenance && result.provenance.status === 'live') {
             analysisMap[result.sourceItemId] = result;
             anyLive = true;
           } else {
             console.log(`Rate limit warning for item ${result.sourceItemId}. Will retry next run.`);
           }
        }
        
        if (anyLive) {
          consecutiveRateLimits = 0;
        } else {
          consecutiveRateLimits++;
        }
        
        saveCounter++;
        // Save incrementally to DB every 5 batches (~15 items) so frontend updates
        if (saveCounter % 5 === 0) {
           await redis.set('spotify_mock_analysis', JSON.stringify(analysisMap));
           console.log(`Saved progress to DB. Total analyzed: ${Object.keys(analysisMap).length}`);
        }
      } else {
        console.error('Batch failed with status:', res.status);
      }
    } catch(e) {
      console.error('Error processing batch:', e.message);
    }
    
    // Strict delay to respect 15 RPM limits on free tier (12s total per batch approx ensures we stay under 15 RPM)
    await delay(12000); 
  }
  
  // Final save
  await redis.set('spotify_mock_analysis', JSON.stringify(analysisMap));
  console.log(`Finished! Total analyzed: ${Object.keys(analysisMap).length}`);
}

main().catch(console.error);
