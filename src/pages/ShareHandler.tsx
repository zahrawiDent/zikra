/**
 * Share Target Handler
 * 
 * This page handles content shared to the app via the Web Share Target API.
 * When a user shares a URL/text to Zikra from another app (like YouTube, Chrome, etc.),
 * they'll be redirected here, and we'll open the Add Resource modal with the shared content.
 */

import { type Component, onMount } from 'solid-js';
import { useSearchParams, useNavigate } from '@solidjs/router';

const ShareHandler: Component = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  onMount(() => {
    // Extract shared data from URL params
    const sharedUrl = searchParams.url as string;
    const sharedText = searchParams.text as string;
    const sharedTitle = searchParams.title as string;

    // Try to extract a URL from the shared content
    // YouTube and other apps sometimes put the URL in 'text' or combine title + url
    let url = sharedUrl;
    
    if (!url && sharedText) {
      // Try to find a URL in the text
      const urlMatch = sharedText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        url = urlMatch[0];
      }
    }

    if (url) {
      // Navigate to home with the add-resource action
      // This will trigger the AddResourceModal in app.tsx
      navigate(`/?action=add-resource&url=${encodeURIComponent(url)}${sharedTitle ? `&hint_title=${encodeURIComponent(sharedTitle)}` : ''}`, { replace: true });
    } else {
      // No URL found, just go to home
      navigate('/', { replace: true });
    }
  });

  return (
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p class="text-gray-600">Processing shared content...</p>
      </div>
    </div>
  );
};

export default ShareHandler;
