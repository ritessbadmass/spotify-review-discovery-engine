import gplay from 'google-play-scraper';
import { SourceItem, delay, hashPseudonym, matchesDiscoveryKeywords, cleanText, saveToCsv } from './utils';

const MAX_REVIEWS = 300;
const BATCH_SIZE = 100;
const TARGET_APP = 'com.spotify.music';

async function fetchPlayStoreReviews() {
  console.log(`Starting Play Store scraper for ${TARGET_APP}...`);
  const items: SourceItem[] = [];
  let token: string | undefined = undefined;
  
  while (items.length < MAX_REVIEWS) {
    try {
      const options: any = {
        appId: TARGET_APP,
        lang: 'en',
        country: 'us',
        sort: (gplay.sort as any).NEWEST,
        num: BATCH_SIZE,
      };
      if (token) options.nextPaginationToken = token;

      console.log(`Fetching batch... (Current total: ${items.length})`);
      const result = await gplay.reviews(options);
      const reviews = result.data;
      token = result.nextPaginationToken;

      for (const review of reviews) {
        if (!review.text) continue;
        
        // Filter out very short reviews and those without discovery keywords
        if (review.text.length < 50 || !matchesDiscoveryKeywords(review.text)) {
          continue;
        }

        const rawText = review.text;
        items.push({
          id: `play-${review.id}`,
          sourceType: 'play_store',
          sourceUrl: `https://play.google.com/store/apps/details?id=${TARGET_APP}&reviewId=${review.id}`,
          author: hashPseudonym(review.userName),
          date: new Date(review.date).toISOString(),
          rawText,
          normalizedText: cleanText(rawText),
          productName: 'Spotify Android',
          language: 'en',
          region: 'US' // Appended from request options
        });

        if (items.length >= MAX_REVIEWS) break;
      }

      if (!token || reviews.length === 0) {
        console.log('No more pages available.');
        break;
      }

      // Polite scraping delay
      await delay(2000);

    } catch (err) {
      console.error('Error fetching Play Store reviews:', err);
      break;
    }
  }

  console.log(`Finished Play Store scraper. Extracted ${items.length} relevant reviews.`);
  saveToCsv('play-store-reviews.csv', items);
}

fetchPlayStoreReviews();
