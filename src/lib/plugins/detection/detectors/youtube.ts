/**
 * YouTube Resource Detector
 * 
 * Detects YouTube videos, playlists, channels, and shorts from URLs or video IDs.
 */

import type { ResourceDetector, DetectionResult } from '../types';

/**
 * URL patterns for YouTube content
 */
const YOUTUBE_PATTERNS = {
  video: [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ],
  shorts: [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ],
  playlist: [
    /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    /[?&]list=([a-zA-Z0-9_-]+)/,
  ],
  channel: [
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
  ],
  videoId: /^[a-zA-Z0-9_-]{11}$/,
};

/**
 * Detect YouTube content type from URL
 */
function detectYouTubeType(input: string): {
  type: 'video' | 'shorts' | 'playlist' | 'channel' | 'video-id';
  id: string;
  pattern: string;
} | null {
  // Check video patterns
  for (const pattern of YOUTUBE_PATTERNS.video) {
    const match = input.match(pattern);
    if (match) {
      return { type: 'video', id: match[1], pattern: 'video-url' };
    }
  }

  // Check shorts patterns
  for (const pattern of YOUTUBE_PATTERNS.shorts) {
    const match = input.match(pattern);
    if (match) {
      return { type: 'shorts', id: match[1], pattern: 'shorts-url' };
    }
  }

  // Check playlist patterns
  for (const pattern of YOUTUBE_PATTERNS.playlist) {
    const match = input.match(pattern);
    if (match) {
      return { type: 'playlist', id: match[1], pattern: 'playlist-url' };
    }
  }

  // Check channel patterns
  for (const pattern of YOUTUBE_PATTERNS.channel) {
    const match = input.match(pattern);
    if (match) {
      return { type: 'channel', id: match[1], pattern: 'channel-url' };
    }
  }

  // Check bare video ID
  if (YOUTUBE_PATTERNS.videoId.test(input)) {
    return { type: 'video-id', id: input, pattern: 'bare-video-id' };
  }

  return null;
}

/**
 * YouTube resource detector implementation
 */
export const youtubeDetector: ResourceDetector = {
  id: 'youtube',
  priority: 100, // Highest priority - most specific patterns

  detect(input: string): DetectionResult | null {
    const result = detectYouTubeType(input);
    if (!result) return null;

    // Determine confidence based on match type
    const isUrl = input.includes('youtube.com') || input.includes('youtu.be');
    const confidence = isUrl ? 'definite' : 'high';

    const typeLabels: Record<string, string> = {
      video: 'YouTube Video',
      shorts: 'YouTube Short',
      playlist: 'YouTube Playlist',
      channel: 'YouTube Channel',
      'video-id': 'YouTube Video',
    };

    return {
      pluginId: 'youtube',
      displayName: typeLabels[result.type] || 'YouTube',
      confidence,
      inputType: isUrl ? 'url' : 'identifier',
      context: {
        extractedId: result.id,
        matchedPattern: result.pattern,
        metadata: {
          contentType: result.type,
        },
      },
    };
  },

  detectAll(input: string): DetectionResult[] {
    const primary = this.detect(input);
    return primary ? [primary] : [];
  },
};
