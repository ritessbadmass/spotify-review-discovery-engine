import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AnalysisResult, InsightCluster } from './types';

// Server-side cache path
const CACHE_DIR = path.resolve(process.cwd(), 'data', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'analysis-cache.json');
const CLUSTER_CACHE_FILE = path.join(CACHE_DIR, 'cluster-cache.json');

interface CacheStore {
  [hashKey: string]: AnalysisResult;
}

interface ClusterCacheStore {
  [hashKey: string]: InsightCluster[];
}

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function hashText(id: string, text: string): string {
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  return `${id}_${hash}`;
}

export function hashClusterEvidence(items: any[]): string {
  // Simple hash of stringified array
  const text = JSON.stringify(items);
  return crypto.createHash('sha256').update(text).digest('hex');
}

// Analysis Cache
export function readAnalysisCache(): CacheStore {
  try {
    ensureCacheDir();
    if (!fs.existsSync(CACHE_FILE)) return {};
    const content = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to read analysis cache', err);
    return {};
  }
}

export function writeAnalysisCache(store: CacheStore): void {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write analysis cache', err);
  }
}

// Cluster Cache
export function readClusterCache(): ClusterCacheStore {
  try {
    ensureCacheDir();
    if (!fs.existsSync(CLUSTER_CACHE_FILE)) return {};
    const content = fs.readFileSync(CLUSTER_CACHE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to read cluster cache', err);
    return {};
  }
}

export function writeClusterCache(store: ClusterCacheStore): void {
  try {
    ensureCacheDir();
    fs.writeFileSync(CLUSTER_CACHE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write cluster cache', err);
  }
}
