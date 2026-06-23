import { SourceItem, hashPseudonym, matchesDiscoveryKeywords, cleanText, saveToCsv } from './utils';

const TARGET_SUBREDDITS = ['spotify', 'truespotify'];
const MAX_POSTS_PER_SUB = 50;

async function fetchRedditFeedback() {
  console.log('Starting Reddit fetcher (bypassing OAuth via public JSON endpoint)...');
  
  const items: SourceItem[] = [];

  try {
    for (const sub of TARGET_SUBREDDITS) {
      console.log(`Fetching top posts from r/${sub}...`);
      
      const response = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=${MAX_POSTS_PER_SUB}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch from r/${sub}: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      const posts = data.data.children;
      
      for (const postWrapper of posts) {
        const post = postWrapper.data;
        
        // Evaluate Top-level post
        if (post.selftext && post.selftext.length > 50 && matchesDiscoveryKeywords(post.selftext)) {
          items.push({
            id: `reddit-post-${post.id}`,
            sourceType: 'reddit',
            sourceUrl: `https://reddit.com${post.permalink}`,
            author: hashPseudonym(post.author || 'Anonymous'),
            date: new Date(post.created_utc * 1000).toISOString(),
            rawText: post.selftext,
            normalizedText: cleanText(post.selftext),
            productName: 'Spotify General',
            language: 'en',
            region: 'Global'
          });
        }
        
        // We skip comments for the public JSON scraper to avoid hitting rate limits too fast
        // since getting comments requires hitting the endpoint for every single post.
      }
      
      // Wait to be polite to Reddit's unauthenticated API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (err) {
    console.error('Error fetching Reddit data (failed gracefully):', err);
  }

  console.log(`Finished Reddit fetcher. Extracted ${items.length} relevant items.`);
  saveToCsv('reddit-reviews.csv', items);
}

fetchRedditFeedback();
