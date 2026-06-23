import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Using the exact SourceItem schema from the Next.js app to ensure compatibility
export interface SourceItem {
  id: string;
  sourceType: string;
  sourceUrl?: string;
  author: string;
  date: string;
  rawText: string;
  normalizedText: string;
  productName: string;
  language: string;
  region: string;
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function hashPseudonym(username: string): string {
  const hash = crypto.createHash('sha256').update(username).digest('hex');
  return `user_${hash.substring(0, 6)}`;
}

export function matchesDiscoveryKeywords(text: string): boolean {
  if (!text) return false;
  
  const keywords = [
    'discover', 'recommendation', 'repetitive', 'same song', 'same artist', 
    'algorithm', 'playlist', 'taste', 'discover weekly', 'shuffle', 
    'on repeat', 'release radar', 'new music'
  ];
  
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw));
}

export function cleanText(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ');
}

export function saveToCsv(filename: string, items: SourceItem[]): void {
  const dirPath = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, filename);
  const csvString = Papa.unparse(items);
  
  fs.writeFileSync(filePath, csvString, 'utf8');
  console.log(`Saved ${items.length} items to ${filePath}`);
}
