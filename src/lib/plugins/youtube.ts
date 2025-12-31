// YouTube plugin - fetches video and playlist data from YouTube URLs
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

// Extract playlist ID from YouTube URL
function extractPlaylistId(url: string): string | null {
  const patterns = [
    /[?&]list=([^&\n?#]+)/,
    /youtube\.com\/playlist\?list=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Determine if URL is primarily a playlist (playlist page or video with list param)
function isPlaylistUrl(url: string): boolean {
  // Direct playlist page
  if (url.includes('youtube.com/playlist')) return true;
  // Video URL with playlist - treat as playlist if it's the main intent
  if (url.includes('list=') && !url.includes('watch?v=')) return true;
  return false;
}

// Fetch video data using oEmbed (no API key needed)
async function fetchVideoData(videoId: string): Promise<FetchedResourceData> {
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
        type: 'video',
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
      metadata: { videoId, type: 'video' },
    };
  }
}

// Fetch playlist data by scraping the page (no API key needed)
async function fetchPlaylistData(playlistId: string, originalUrl: string): Promise<FetchedResourceData> {
  // Try oEmbed first for playlist
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${playlistId}&format=json`;
  
  try {
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        description: `Playlist by ${data.author_name}`,
        url: `https://www.youtube.com/playlist?list=${playlistId}`,
        thumbnail: data.thumbnail_url,
        metadata: {
          playlistId,
          type: 'playlist',
          authorName: data.author_name,
          authorUrl: data.author_url,
        },
      };
    }
  } catch (error) {
    // oEmbed failed, continue to fallback
  }

  // Fallback: return basic playlist data
  return {
    title: 'YouTube Playlist',
    description: 'YouTube Playlist',
    url: `https://www.youtube.com/playlist?list=${playlistId}`,
    // Use a generic playlist thumbnail or first video thumbnail if available
    thumbnail: `https://i.ytimg.com/vi/${playlistId}/default.jpg`,
    metadata: { 
      playlistId, 
      type: 'playlist',
    },
  };
}

// Main fetch function that handles both videos and playlists
async function fetchYouTubeData(url: string): Promise<FetchedResourceData> {
  const playlistId = extractPlaylistId(url);
  const videoId = extractVideoId(url);
  
  // If it's a playlist URL (direct playlist page), fetch playlist data
  if (isPlaylistUrl(url) && playlistId) {
    return fetchPlaylistData(playlistId, url);
  }
  
  // If it's a video URL with a playlist, fetch video but note the playlist
  if (videoId && playlistId) {
    const videoData = await fetchVideoData(videoId);
    videoData.metadata = {
      ...videoData.metadata,
      playlistId,
      partOfPlaylist: true,
    };
    videoData.url = `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}`;
    return videoData;
  }
  
  // Regular video URL
  if (videoId) {
    return fetchVideoData(videoId);
  }
  
  // Just a playlist ID in URL
  if (playlistId) {
    return fetchPlaylistData(playlistId, url);
  }
  
  throw new Error('Invalid YouTube URL');
}

export const youtubePlugin: ResourcePlugin = {
  id: 'youtube',
  name: 'YouTube',
  icon: Youtube,
  color: '#ff0000',
  inputType: 'url',
  placeholder: 'Paste YouTube URL (video or playlist)',
  
  validate: (input: string) => {
    return extractVideoId(input) !== null || extractPlaylistId(input) !== null;
  },
  
  fetchFromUrl: fetchYouTubeData,
};
