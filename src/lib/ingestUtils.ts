import { DraftSourceItem, SourceItem } from './types';

export function cleanText(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/[\r\n]+/g, ' ') // Remove extra line breaks
    .replace(/[“”]/g, '"')    // Normalize smart quotes
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ');    // Normalize multiple spaces
}

export function detectLanguage(text: string): string {
  // Simple mock: if it contains many non-ASCII chars, guess 'non-en', else 'en'
  const nonAscii = text.match(/[^\x00-\x7F]/g);
  if (nonAscii && nonAscii.length > text.length * 0.1) {
    return 'non-en';
  }
  return 'en';
}

/**
 * Checks for duplicates within the new batch AND against existing items.
 * A duplicate is defined here as an exact match of the cleaned text.
 */
export function flagDuplicates(
  newItems: DraftSourceItem[],
  existingItems: SourceItem[]
): DraftSourceItem[] {
  const existingTexts = new Set(existingItems.map(item => item.normalizedText));
  const seenInBatch = new Set<string>();

  return newItems.map(item => {
    const isDup = existingTexts.has(item.normalizedText) || seenInBatch.has(item.normalizedText);
    seenInBatch.add(item.normalizedText);
    return {
      ...item,
      isDuplicate: isDup
    };
  });
}
