// YouTube plugin - fetches video data from YouTube URLs
import type { ResourcePlugin, FetchedResourceData } from './types';
import { Youtube } from 'lucide-solid';

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch video data using oEmbed (no API key needed)
async function fetchVideoData(url: string): Promise<FetchedResourceData> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Use oEmbed API (no key required)
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch video data');
    }
    
    const data = await response.json();
    
    return {
      title: data.title,
      description: `By ${data.author_name}`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      metadata: {
        videoId,
        authorName: data.author_name,
        authorUrl: data.author_url,
        providerName: data.provider_name,
        thumbnailUrl: data.thumbnail_url,
        thumbnailWidth: data.thumbnail_width,
        thumbnailHeight: data.thumbnail_height,
      },
    };
  } catch (error) {
    // Fallback: return basic data with video ID
    return {
      title: 'YouTube Video',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      metadata: { videoId },
    };
  }
}

export const youtubePlugin: ResourcePlugin = {
  id: 'youtube',
  name: 'YouTube Video',
  icon: Youtube,
  color: '#ff0000',
  inputType: 'url',
  placeholder: 'Paste YouTube URL (e.g., https://youtube.com/watch?v=...)',
  
  validate: (input: string) => {
    return extractVideoId(input) !== null;
  },
  
  fetchFromUrl: fetchVideoData,
};
