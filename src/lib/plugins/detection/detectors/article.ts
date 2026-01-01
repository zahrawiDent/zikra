/**
 * Article/Website Resource Detector
 * 
 * Detects general web URLs and articles. This is a catch-all for URLs
 * that don't match more specific patterns.
 */

import type { ResourceDetector, DetectionResult } from '../types';

/**
 * Check if input is a valid URL
 */
function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if input looks like a URL without protocol
 */
function looksLikeUrl(input: string): boolean {
  // Match patterns like "example.com", "www.example.com/path"
  return /^(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([\/\?#].*)?$/.test(input);
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * Known article/news domains for higher confidence detection
 */
const KNOWN_ARTICLE_DOMAINS = [
  'medium.com',
  'dev.to',
  'hashnode.dev',
  'substack.com',
  'blog.',
  'news.',
  'article.',
  'post.',
  'wikipedia.org',
  'docs.',
];

/**
 * Article resource detector implementation
 */
export const articleDetector: ResourceDetector = {
  id: 'article',
  priority: 10, // Low priority - catch-all for URLs

  detect(input: string): DetectionResult | null {
    // Full URL with protocol
    if (isValidUrl(input)) {
      const domain = extractDomain(input);
      const isKnownArticleDomain = KNOWN_ARTICLE_DOMAINS.some(
        pattern => domain.includes(pattern)
      );

      return {
        pluginId: 'article',
        displayName: 'Article / Website',
        confidence: isKnownArticleDomain ? 'high' : 'medium',
        inputType: 'url',
        context: {
          metadata: {
            domain,
            isKnownArticleDomain,
          },
        },
      };
    }

    // URL without protocol
    if (looksLikeUrl(input)) {
      const domain = extractDomain(input);
      return {
        pluginId: 'article',
        displayName: 'Article / Website',
        confidence: 'medium',
        inputType: 'url',
        context: {
          metadata: {
            domain,
            needsProtocol: true,
          },
        },
      };
    }

    return null;
  },

  detectAll(input: string): DetectionResult[] {
    const primary = this.detect(input);
    return primary ? [primary] : [];
  },
};
