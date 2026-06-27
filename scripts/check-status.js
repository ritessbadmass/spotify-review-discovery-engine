const { Redis } = require('@upstash/redis');
require('dotenv').config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function checkStatus() {
  console.log('Checking database status...');
  try {
    const items = await redis.get('spotify_mock_items');
    const analysis = await redis.get('spotify_mock_analysis');
    
    const itemsCount = items ? items.length : 0;
    const analysisCount = analysis ? Object.keys(analysis).length : 0;
    
    console.log(`Total Source Items in DB: ${itemsCount}`);
    console.log(`Total Analyzed Items in DB: ${analysisCount}`);
    
    if (itemsCount > 0 && analysisCount > 0) {
      console.log(`Progress: ${Math.round((analysisCount / itemsCount) * 100)}% (${analysisCount}/${itemsCount})`);
    } else if (itemsCount > 0) {
      console.log('Ingestion completed, but analysis has not started or is empty.');
    } else {
      console.log('Database is currently empty.');
    }
  } catch (err) {
    console.error('Error fetching from DB:', err.message);
  }
}

checkStatus().catch(console.error);
