import store from 'app-store-scraper';
import { SourceItem, hashPseudonym, matchesDiscoveryKeywords, cleanText, saveToCsv } from './utils';

const TARGET_APP_ID = '324684580'; // Spotify iOS App Store ID

async function fetchAppStoreReviews() {
  console.log(`Starting App Store scraper for Spotify (ID: ${TARGET_APP_ID})...`);
  console.log('Note: The App Store API returns a much smaller volume of recent reviews compared to Google Play.');
  
  const items: SourceItem[] = [];

  try {
    // App Store Scraper returns up to 10 pages maximum (500 reviews usually if num=50)
    for (let page = 1; page <= 10; page++) {
      console.log(`Fetching page ${page}...`);
      
      const reviews = await store.reviews({
        id: TARGET_APP_ID,
        country: 'us',
        page: page,
        sort: store.sort.HELPFUL
      });

      if (!reviews || reviews.length === 0) {
        console.log('No more reviews available.');
        break;
      }

      for (const review of reviews) {
        const fullText = `${review.title} - ${review.text}`;
        
        // Filter out very short reviews and those without discovery keywords
        if (fullText.length < 50 || !matchesDiscoveryKeywords(fullText)) {
          continue;
        }

        items.push({
          id: `appstore-${review.id}`,
          sourceType: 'app_store',
          sourceUrl: `https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580`,
          author: hashPseudonym(review.userName),
          date: new Date().toISOString(), // App store scraper sometimes doesn't provide exact date reliably
          rawText: fullText,
          normalizedText: cleanText(fullText),
          productName: 'Spotify iOS',
          language: 'en',
          region: 'US'
        });
      }
    }

  } catch (err) {
    console.error('Error fetching App Store reviews (failed gracefully):', err);
  }

  console.log(`Finished App Store scraper. Extracted ${items.length} relevant reviews.`);
  saveToCsv('app-store-reviews.csv', items);
}

fetchAppStoreReviews();
