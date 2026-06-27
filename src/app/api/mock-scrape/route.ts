import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { SourceType } from '@/lib/types';
import { cleanText, detectLanguage } from '@/lib/ingestUtils';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'scraped-reviews.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const results = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true
    });

    const rows = results.data as any[];
    
    // Only return 100 items to avoid Gemini Free Tier 1500 RPD limit
    const items = rows.slice(0, 100).map((row, idx) => {
      const rawText = row.rawText || row.text || row.review || '';
      const normalizedText = cleanText(rawText);
      return {
        id: `draft-${Date.now()}-${idx}`,
        sourceType: (row.sourceType as SourceType) || 'play_store',
        sourceUrl: row.sourceUrl || '',
        author: row.author || 'Anonymous',
        date: row.date || new Date().toISOString().split('T')[0],
        rawText,
        normalizedText,
        productName: row.productName || 'Spotify App',
        language: detectLanguage(normalizedText),
        region: row.region || 'US',
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error reading mock scrape data:', error);
    return NextResponse.json({ error: 'Failed to read scraped reviews' }, { status: 500 });
  }
}
