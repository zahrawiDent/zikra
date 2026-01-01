// DOM Elements
const loadingEl = document.getElementById('loading');
const formEl = document.getElementById('resourceForm');
const successEl = document.getElementById('success');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('errorMessage');

const typeSelect = document.getElementById('type');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const urlInput = document.getElementById('url');
const thumbnailInput = document.getElementById('thumbnail');
const thumbnailPreview = document.getElementById('thumbnailPreview');
const thumbnailImg = document.getElementById('thumbnailImg');
const hubUrlInput = document.getElementById('hubUrl');
const saveBtn = document.getElementById('saveBtn');

// Load saved hub URL from storage
chrome.storage.sync.get(['hubUrl'], (result) => {
  if (result.hubUrl) {
    hubUrlInput.value = result.hubUrl;
  }
});

// Detect resource type from URL
function detectType(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('arxiv.org') || url.includes('pubmed') || url.includes('doi.org') || url.includes('ncbi.nlm.nih.gov')) {
    return 'paper';
  }
  if (url.includes('amazon.com/') && url.includes('/dp/')) {
    return 'book';
  }
  return 'article';
}

// Extract YouTube video ID
function getYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

// Get current tab info and populate form
async function loadPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('Could not get current tab');
    }

    const url = tab.url || '';
    const title = tab.title || '';
    
    // Detect type
    const type = detectType(url);
    typeSelect.value = type;
    
    // Set basic info
    titleInput.value = title;
    urlInput.value = url;
    
    // Try to get thumbnail
    let thumbnail = '';
    if (type === 'youtube') {
      const videoId = getYouTubeId(url);
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    } else {
      thumbnail = tab.favIconUrl || '';
    }
    
    if (thumbnail) {
      thumbnailInput.value = thumbnail;
      showThumbnailPreview(thumbnail);
    }

    // Try to get Open Graph and meta data from page
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Helper to get meta content by property or name
          const getMeta = (selectors) => {
            for (const selector of selectors) {
              const el = document.querySelector(selector);
              if (el?.content) return el.content;
            }
            return '';
          };

          // Extract Open Graph data
          const ogData = {
            // Title - prefer og:title over page title
            ogTitle: getMeta([
              'meta[property="og:title"]',
              'meta[name="twitter:title"]'
            ]),
            // Description
            description: getMeta([
              'meta[property="og:description"]',
              'meta[name="twitter:description"]',
              'meta[name="description"]'
            ]),
            // Image - prefer og:image
            ogImage: getMeta([
              'meta[property="og:image"]',
              'meta[property="og:image:url"]',
              'meta[name="twitter:image"]',
              'meta[name="twitter:image:src"]'
            ]),
            // Site name
            siteName: getMeta([
              'meta[property="og:site_name"]'
            ]),
            // Author
            author: getMeta([
              'meta[name="author"]',
              'meta[property="article:author"]',
              'meta[name="twitter:creator"]'
            ]),
            // Published date
            publishedDate: getMeta([
              'meta[property="article:published_time"]',
              'meta[name="publish_date"]',
              'meta[name="date"]'
            ]),
            // Type
            ogType: getMeta([
              'meta[property="og:type"]'
            ])
          };

          // Try to get author from structured data (JSON-LD)
          if (!ogData.author) {
            try {
              const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
              for (const script of ldScripts) {
                const data = JSON.parse(script.textContent);
                const items = Array.isArray(data) ? data : [data];
                for (const item of items) {
                  if (item.author) {
                    ogData.author = typeof item.author === 'string' 
                      ? item.author 
                      : item.author.name || '';
                    break;
                  }
                }
                if (ogData.author) break;
              }
            } catch (e) {
              // JSON-LD parsing failed, that's ok
            }
          }

          return ogData;
        }
      });
      
      if (result?.result) {
        const ogData = result.result;
        
        // Use OG title if available and better than page title
        if (ogData.ogTitle && ogData.ogTitle.length > 0) {
          titleInput.value = ogData.ogTitle;
        }
        
        // Build description with metadata
        let description = ogData.description || '';
        const metaParts = [];
        
        if (ogData.siteName) {
          metaParts.push(`Source: ${ogData.siteName}`);
        }
        if (ogData.author) {
          metaParts.push(`Author: ${ogData.author}`);
        }
        if (ogData.publishedDate) {
          const date = new Date(ogData.publishedDate);
          if (!isNaN(date.getTime())) {
            metaParts.push(`Published: ${date.toLocaleDateString()}`);
          }
        }
        
        if (metaParts.length > 0) {
          description = description 
            ? `${description}\n\n${metaParts.join(' • ')}`
            : metaParts.join(' • ');
        }
        
        if (description) {
          descriptionInput.value = description;
        }
        
        // Use OG image for thumbnail
        if (ogData.ogImage) {
          // Handle relative URLs
          let imageUrl = ogData.ogImage;
          if (imageUrl.startsWith('/')) {
            const urlObj = new URL(url);
            imageUrl = `${urlObj.origin}${imageUrl}`;
          }
          thumbnailInput.value = imageUrl;
          showThumbnailPreview(imageUrl);
        }
      }
    } catch (e) {
      // Script injection might fail on some pages, that's ok
      console.log('Could not extract page metadata:', e);
    }

    // Show form
    loadingEl.classList.add('hidden');
    formEl.classList.remove('hidden');
    
  } catch (err) {
    showError('Could not load page information: ' + err.message);
  }
}

function showThumbnailPreview(url) {
  thumbnailImg.src = url;
  thumbnailImg.onload = () => {
    thumbnailPreview.classList.remove('hidden');
  };
  thumbnailImg.onerror = () => {
    thumbnailPreview.classList.add('hidden');
  };
}

// Update thumbnail preview when input changes
thumbnailInput.addEventListener('input', (e) => {
  const url = e.target.value.trim();
  if (url) {
    showThumbnailPreview(url);
  } else {
    thumbnailPreview.classList.add('hidden');
  }
});

// Save resource
formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  const hubUrl = hubUrlInput.value.trim().replace(/\/$/, '');
  
  // Save hub URL for future use
  chrome.storage.sync.set({ hubUrl });
  
  const resource = {
    type: typeSelect.value,
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    url: urlInput.value.trim(),
    thumbnail: thumbnailInput.value.trim(),
  };

  try {
    // Store in extension storage for the app to pick up
    const pendingResources = await getPendingResources();
    pendingResources.push({
      ...resource,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    
    await chrome.storage.local.set({ pendingResources });
    
    // Try to open the app with the resource data
    const params = new URLSearchParams({
      action: 'add-resource',
      type: resource.type,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      thumbnail: resource.thumbnail,
    });
    
    // Open the app with resource data
    chrome.tabs.create({ url: `${hubUrl}?${params.toString()}` });
    
    showSuccess();
    
  } catch (err) {
    showError('Failed to save resource: ' + err.message);
  }
});

async function getPendingResources() {
  const result = await chrome.storage.local.get(['pendingResources']);
  return result.pendingResources || [];
}

function showSuccess() {
  formEl.classList.add('hidden');
  successEl.classList.remove('hidden');
}

function showError(message) {
  loadingEl.classList.add('hidden');
  formEl.classList.add('hidden');
  errorEl.classList.remove('hidden');
  errorMessageEl.textContent = message;
}

// Open hub button
document.getElementById('openHub').addEventListener('click', () => {
  const hubUrl = hubUrlInput.value.trim();
  chrome.tabs.create({ url: hubUrl });
  window.close();
});

// Retry button
document.getElementById('retry').addEventListener('click', () => {
  errorEl.classList.add('hidden');
  loadingEl.classList.remove('hidden');
  loadPageInfo();
});

// Initialize
loadPageInfo();
