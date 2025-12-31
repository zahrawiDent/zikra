// Generic Article/Website plugin - for any URL
import type { ResourcePlugin, FetchedResourceData } from './types';
import { Globe } from 'lucide-solid';

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function fetchArticleData(url: string): Promise<FetchedResourceData> {
  // We can't fetch arbitrary URLs due to CORS, so we'll extract what we can from the URL
  // In a real app, you'd use a backend proxy or browser extension
  
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace('www.', '');
  
  // Try to extract a title from the URL path
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1] || '';
  const titleFromUrl = lastPart
    .replace(/[-_]/g, ' ')
    .replace(/\.\w+$/, '') // Remove file extension
    .replace(/\b\w/g, c => c.toUpperCase()); // Title case
  
  return {
    title: titleFromUrl || `Article from ${domain}`,
    description: `Saved from ${domain}`,
    url,
    metadata: {
      domain,
      savedAt: new Date().toISOString(),
    },
  };
}

export const articlePlugin: ResourcePlugin = {
  id: 'article',
  name: 'Website/Article',
  icon: Globe,
  color: '#22c55e',
  inputType: 'url',
  placeholder: 'Paste any website URL...',
  
  validate: isValidUrl,
  
  fetchFromUrl: fetchArticleData,
};
