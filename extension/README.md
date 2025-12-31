# Study Hub Browser Extension

A browser extension to quickly save resources from any webpage to your Study Hub.

## Installation

### Chrome / Edge / Brave

1. Open your browser and go to `chrome://extensions/` (or `edge://extensions/` for Edge)
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project

### Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from the `extension` folder

## Setup

1. Make sure your Study Hub app is running (usually at `http://localhost:5173`)
2. Click the extension icon in your browser toolbar
3. The first time, enter your Study Hub URL in the settings

## Usage

1. Navigate to any webpage you want to save (article, YouTube video, research paper, etc.)
2. Click the Study Hub extension icon
3. The extension will auto-detect:
   - Page title
   - URL
   - Description (from meta tags)
   - Thumbnail (from og:image or YouTube)
   - Resource type (article, video, paper, book)
4. Edit any fields if needed
5. Click "Save Resource"
6. The Study Hub will open with the resource pre-filled

## Supported Resource Types

- **Articles** - Blog posts, news articles, documentation
- **YouTube Videos** - Auto-detects YouTube URLs and fetches thumbnails
- **Research Papers** - ArXiv, PubMed, DOI links
- **Books** - Amazon book pages

## Icons

The extension needs PNG icons. You can convert the included `icon.svg` to PNG:

```bash
# Using ImageMagick
convert icons/icon.svg -resize 16x16 icons/icon16.png
convert icons/icon.svg -resize 48x48 icons/icon48.png
convert icons/icon.svg -resize 128x128 icons/icon128.png

# Or use any online SVG to PNG converter
```

Or simply replace the icon files with your own 16x16, 48x48, and 128x128 PNG images.
