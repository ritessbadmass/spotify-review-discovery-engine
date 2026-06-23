import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { SourceItem, saveToCsv } from './utils';

function mergeData() {
  console.log('Starting data merge...');
  const dirPath = path.resolve(__dirname, '../data');
  const filesToMerge = ['play-store-reviews.csv', 'app-store-reviews.csv', 'reddit-reviews.csv'];
  
  const mergedItems: SourceItem[] = [];
  const seenHashes = new Set<string>();

  for (const file of filesToMerge) {
    const filePath = path.join(dirPath, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${file} as it does not exist.`);
      continue;
    }

    const csvContent = fs.readFileSync(filePath, 'utf8');
    const results = Papa.parse<SourceItem>(csvContent, { header: true, skipEmptyLines: true });
    
    let addedCount = 0;
    for (const item of results.data) {
      // Very simple deduplication across sources to prevent overlapping identically copied text
      if (!seenHashes.has(item.normalizedText)) {
        seenHashes.add(item.normalizedText);
        mergedItems.push(item);
        addedCount++;
      }
    }
    console.log(`Merged ${addedCount} items from ${file}`);
  }

  console.log(`Merge complete. Total unique items: ${mergedItems.length}`);
  saveToCsv('scraped-reviews.csv', mergedItems);
  console.log('Data is ready to be uploaded via the UI at http://localhost:3000/ingest');
}

mergeData();
