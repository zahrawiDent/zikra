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

// Extract fallback data from URL when API fails
function extractFallbackData(url: string): { title: string; domain: string } {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace('www.', '');
  
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1] || '';
  const titleFromUrl = lastPart
    .replace(/[-_]/g, ' ')
    .replace(/\.\w+$/, '')
    .replace(/\b\w/g, c => c.toUpperCase());
  
  return {
    title: titleFromUrl || `Article from ${domain}`,
    domain,
  };
}

// Parse OG metadata from HTML string
function parseMetadataFromHtml(html: string, baseUrl: string): { title?: string; description?: string; image?: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const getMetaContent = (selectors: string[]): string | undefined => {
    for (const selector of selectors) {
      const el = doc.querySelector(selector);
      if (el) {
        const content = el.getAttribute('content') || el.getAttribute('href');
        if (content?.trim()) return content.trim();
      }
    }
    return undefined;
  };
  
  const title = getMetaContent([
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="title"]',
  ]) || doc.querySelector('title')?.textContent?.trim();
  
  const description = getMetaContent([
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
    'meta[name="description"]',
  ]);
  
  let image = getMetaContent([
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
    'link[rel="image_src"]',
  ]);
  
  // Make relative image URLs absolute
  if (image && !image.startsWith('http')) {
    try {
      const urlObj = new URL(baseUrl);
      image = image.startsWith('/') 
        ? `${urlObj.origin}${image}`
        : `${urlObj.origin}/${image}`;
    } catch {
      // ignore
    }
  }
  
  return { title, description, image };
}

// Try multiple CORS proxies
async function fetchWithProxy(url: string): Promise<{ title?: string; description?: string; image?: string } | null> {
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];
  
  for (const makeProxyUrl of proxies) {
    try {
      const proxyUrl = makeProxyUrl(url);
      console.log('[article plugin] Trying proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl, { 
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        console.log('[article plugin] Proxy returned status:', response.status);
        continue;
      }
      
      const html = await response.text();
      console.log('[article plugin] Got HTML, length:', html.length);
      
      if (html.length < 100) {
        console.log('[article plugin] HTML too short, trying next proxy');
        continue;
      }
      
      const metadata = parseMetadataFromHtml(html, url);
      console.log('[article plugin] Parsed metadata:', metadata);
      
      if (metadata.title || metadata.image) {
        return metadata;
      }
    } catch (err) {
      console.log('[article plugin] Proxy error:', err);
      continue;
    }
  }
  
  console.log('[article plugin] All proxies failed, using fallback');
  return null;
}

async function fetchArticleData(url: string): Promise<FetchedResourceData> {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace('www.', '');
  const fallback = extractFallbackData(url);
  
  // Try to fetch actual metadata
  const metadata = await fetchWithProxy(url);
  
  return {
    title: metadata?.title || fallback.title,
    description: metadata?.description || `Saved from ${domain}`,
    url,
    thumbnail: metadata?.image,
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
