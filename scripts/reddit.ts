import Snoowrap from 'snoowrap';
import dotenv from 'dotenv';
import { SourceItem, hashPseudonym, matchesDiscoveryKeywords, cleanText, saveToCsv } from './utils';

dotenv.config();

const TARGET_SUBREDDITS = ['spotify', 'truespotify'];
const MAX_POSTS_PER_SUB = 50;

async function fetchRedditFeedback() {
  console.log('Starting Reddit fetcher...');
  
  if (!process.env.REDDIT_USER_AGENT || !process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.warn('Missing Reddit OAuth credentials in .env file. Creating an empty CSV and exiting gracefully.');
    saveToCsv('reddit-reviews.csv', []);
    return;
  }

  const r = new Snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN // Only needed if making user-specific requests, but good to have
  });

  const items: SourceItem[] = [];

  try {
    for (const sub of TARGET_SUBREDDITS) {
      console.log(`Fetching top posts from r/${sub}...`);
      
      // Fetching hot/top posts
      const posts = await r.getSubreddit(sub).getHot({ limit: MAX_POSTS_PER_SUB });
      
      for (const post of posts) {
        // Evaluate Top-level post
        if (post.selftext && post.selftext.length > 50 && matchesDiscoveryKeywords(post.selftext)) {
          items.push({
            id: `reddit-post-${post.id}`,
            sourceType: 'reddit',
            sourceUrl: `https://reddit.com${post.permalink}`,
            author: hashPseudonym(post.author.name),
            date: new Date(post.created_utc * 1000).toISOString(),
            rawText: post.selftext,
            normalizedText: cleanText(post.selftext),
            productName: 'Spotify General',
            language: 'en',
            region: 'Global'
          });
        }

        // Expand and evaluate top-level comments
        const comments: any = await (post as any).expandReplies({ limit: 5, depth: 1 });
        for (const comment of comments.comments) {
          if (comment.body && comment.body.length > 50 && matchesDiscoveryKeywords(comment.body)) {
            items.push({
              id: `reddit-comment-${comment.id}`,
              sourceType: 'reddit',
              sourceUrl: `https://reddit.com${comment.permalink}`,
              author: hashPseudonym(comment.author.name),
              date: new Date(comment.created_utc * 1000).toISOString(),
              rawText: comment.body,
              normalizedText: cleanText(comment.body),
              productName: 'Spotify General',
              language: 'en',
              region: 'Global'
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching Reddit data (failed gracefully):', err);
  }

  console.log(`Finished Reddit fetcher. Extracted ${items.length} relevant items.`);
  saveToCsv('reddit-reviews.csv', items);
}

fetchRedditFeedback();
