# Zikra Browser Extension

A minimal browser extension for quickly saving pages to Zikra.

## How It Works

The extension follows a **thin client** philosophy:

1. **Extension** (minimal logic):
   - Extracts URL, title, and basic metadata from current page
   - Shows a preview of what will be saved
   - Opens the Zikra app with the URL

2. **App** (all logic):
   - Auto-detects resource type (YouTube, Paper, Book, Article, etc.)
   - Fetches full metadata using the detection engine
   - Handles saving and organization

This approach:
- ✅ Eliminates duplicate detection/processing logic
- ✅ Keeps the extension simple and easy to maintain
- ✅ Ensures all resources go through the same pipeline
- ✅ Makes updates easier (only update the app)

## Installation

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select this `extension` folder
4. The extension icon will appear in your toolbar

## Usage

1. Navigate to any page you want to save
2. Click the Zikra extension icon
3. Click "Save to Zikra"
4. The app opens with the URL pre-filled and auto-detected

## Configuration

- **App URL**: Set the URL where your Zikra app is running (default: `http://localhost:5173`)

## URL Parameters

The extension opens the app with these parameters:

| Parameter | Description |
|-----------|-------------|
| `action` | Always `add-resource` |
| `url` | The page URL |
| `hint_title` | Pre-extracted title (hint for the app) |
| `hint_description` | Pre-extracted description |
| `hint_thumbnail` | Pre-extracted thumbnail URL |

The app uses these hints but may override them with better data from its detection engine.

## Icons

The extension needs PNG icons:

```bash
# Using ImageMagick
convert icons/icon.svg -resize 16x16 icons/icon16.png
convert icons/icon.svg -resize 48x48 icons/icon48.png
convert icons/icon.svg -resize 128x128 icons/icon128.png
```
