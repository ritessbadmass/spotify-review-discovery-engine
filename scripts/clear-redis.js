const { Redis } = require('@upstash/redis');
require('dotenv').config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function main() {
  console.log('Clearing old mock analysis from Redis...');
  await redis.del('spotify_mock_analysis');
  console.log('Done!');
}
main().catch(console.error);
