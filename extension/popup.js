/**
 * Simplified Extension Popup
 * 
 * Minimal logic - just extracts page info and sends to the app.
 * All detection and processing is done by the app.
 */

// DOM Elements
const loadingEl = document.getElementById('loading');
const readyEl = document.getElementById('ready');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('errorMessage');

const titleEl = document.getElementById('pageTitle');
const urlEl = document.getElementById('pageUrl');
const thumbnailEl = document.getElementById('pageThumbnail');
const hubUrlInput = document.getElementById('hubUrl');
const saveBtn = document.getElementById('saveBtn');
const quickSaveBtn = document.getElementById('quickSaveBtn');

// Page data extracted from current tab
let pageData = null;

// Load saved hub URL from storage
chrome.storage.sync.get(['hubUrl'], (result) => {
  if (result.hubUrl) {
    hubUrlInput.value = result.hubUrl;
  }
});

// Save hub URL when changed
hubUrlInput.addEventListener('change', () => {
  chrome.storage.sync.set({ hubUrl: hubUrlInput.value.trim() });
});

/**
 * Extract minimal page data from current tab
 */
async function loadPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('Could not get current tab');
    }

    const url = tab.url || '';
    const title = tab.title || '';
    
    // Try to get metadata from the page
    let metadata = { description: '', thumbnail: '' };
    
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const getMeta = (selectors) => {
            for (const selector of selectors) {
              const el = document.querySelector(selector);
              if (el?.content) return el.content;
            }
            return '';
          };

          return {
            ogTitle: getMeta(['meta[property="og:title"]', 'meta[name="twitter:title"]']),
            description: getMeta([
              'meta[property="og:description"]',
              'meta[name="twitter:description"]',
              'meta[name="description"]'
            ]),
            thumbnail: getMeta([
              'meta[property="og:image"]',
              'meta[property="og:image:url"]',
              'meta[name="twitter:image"]'
            ]),
          };
        }
      });
      
      if (result?.result) {
        metadata = result.result;
      }
    } catch (e) {
      // Script injection might fail on some pages (chrome://, etc.)
      console.log('Could not extract metadata:', e);
    }

    // Store page data
    pageData = {
      url,
      title: metadata.ogTitle || title,
      description: metadata.description || '',
      thumbnail: normalizeThumbnailUrl(metadata.thumbnail, url) || tab.favIconUrl || '',
    };

    // Update UI
    titleEl.textContent = pageData.title || 'Untitled';
    urlEl.textContent = truncateUrl(pageData.url);
    urlEl.title = pageData.url;
    
    if (pageData.thumbnail) {
      thumbnailEl.src = pageData.thumbnail;
      thumbnailEl.classList.remove('hidden');
    }

    // Show ready state
    loadingEl.classList.add('hidden');
    readyEl.classList.remove('hidden');
    
  } catch (err) {
    showError('Could not load page: ' + err.message);
  }
}

/**
 * Normalize thumbnail URL (handle relative URLs)
 */
function normalizeThumbnailUrl(thumbnail, pageUrl) {
  if (!thumbnail) return '';
  if (thumbnail.startsWith('http')) return thumbnail;
  
  try {
    const urlObj = new URL(pageUrl);
    if (thumbnail.startsWith('/')) {
      return `${urlObj.origin}${thumbnail}`;
    }
    return `${urlObj.origin}/${thumbnail}`;
  } catch {
    return thumbnail;
  }
}

/**
 * Truncate URL for display
 */
function truncateUrl(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const display = urlObj.hostname + (path.length > 30 ? path.slice(0, 30) + '...' : path);
    return display;
  } catch {
    return url.slice(0, 50) + (url.length > 50 ? '...' : '');
  }
}

/**
 * Open the app with the page data for full processing
 */
function openInApp() {
  if (!pageData) return;
  
  const hubUrl = hubUrlInput.value.trim().replace(/\/$/, '');
  
  // Just pass the URL - let the app handle detection and fetching
  const params = new URLSearchParams({
    action: 'add-resource',
    url: pageData.url,
    // Pass pre-extracted data as hints (app can override)
    hint_title: pageData.title,
    hint_description: pageData.description,
    hint_thumbnail: pageData.thumbnail,
  });
  
  chrome.tabs.create({ url: `${hubUrl}?${params.toString()}` });
  window.close();
}

/**
 * Quick save - store data and open app
 */
quickSaveBtn.addEventListener('click', openInApp);
saveBtn.addEventListener('click', openInApp);

/**
 * Show error state
 */
function showError(message) {
  loadingEl.classList.add('hidden');
  readyEl.classList.add('hidden');
  errorEl.classList.remove('hidden');
  errorMessageEl.textContent = message;
}

// Retry button
document.getElementById('retry').addEventListener('click', () => {
  errorEl.classList.add('hidden');
  loadingEl.classList.remove('hidden');
  loadPageInfo();
});

// Initialize
loadPageInfo();
