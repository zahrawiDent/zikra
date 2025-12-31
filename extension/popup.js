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

    // Try to get meta description from page
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const metaDesc = document.querySelector('meta[name="description"]') ||
                          document.querySelector('meta[property="og:description"]');
          const ogImage = document.querySelector('meta[property="og:image"]');
          return {
            description: metaDesc?.content || '',
            ogImage: ogImage?.content || ''
          };
        }
      });
      
      if (result?.result) {
        if (result.result.description) {
          descriptionInput.value = result.result.description;
        }
        if (result.result.ogImage && !thumbnailInput.value) {
          thumbnailInput.value = result.result.ogImage;
          showThumbnailPreview(result.result.ogImage);
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
