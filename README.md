# 🦷 DentStudy - Dentistry Study Hub

A personal study hub for dentistry students to organize and track learning resources.

## Core Concepts

### Three Entities
1. **Resource** - Anything you learn from (YouTube videos, books, papers, articles)
2. **Note** - Your thinking about a resource (summaries, clinical pearls, questions)
3. **Topic** - Dental concepts that tag resources (Endodontics, Prosthodontics, etc.)

## Features

- 📺 **YouTube Integration** - Paste a link, auto-fetch video details
- 📚 **Google Books Search** - Search and save dental textbooks
- 📄 **Research Papers** - Search CrossRef for academic papers
- 🌐 **Web Articles** - Save any URL
- 🏷️ **Topic Tagging** - Organize with multiple topics per resource
- 📝 **Notes** - Add summaries, clinical pearls, questions, and more
- 📊 **Progress Tracking** - Mark resources as to-study, in-progress, or completed

## Plugin Architecture

Add new resource types by creating a plugin in `src/lib/plugins/`:

```typescript
import type { ResourcePlugin } from './types';

export const myPlugin: ResourcePlugin = {
  id: 'my-plugin',
  name: 'My Resource Type',
  icon: MyIcon,
  color: '#3b82f6',
  inputType: 'url' | 'search',
  placeholder: 'Enter URL or search...',
  validate: (input) => boolean,
  fetchFromUrl: async (url) => FetchedResourceData,  // for URL-based
  search: async (query) => SearchResult[],           // for search-based
  getDetails: async (result) => FetchedResourceData, // for search-based
};
```

Register in `src/lib/plugins/index.ts`.

## Tech Stack

- **SolidJS** - Reactive UI framework
- **Solid Router** - Client-side routing
- **Tailwind CSS v4** - Styling
- **TinyBase** - Reactive local storage with IndexedDB persistence
- **Lucide** - Icons

## Development

```bash
pnpm install
pnpm dev
```

## Project Structure

```
src/
├── components/       # UI components
│   └── ui/          # Base UI primitives
├── lib/
│   ├── db/          # Database schema, hooks, actions
│   └── plugins/     # Resource type plugins
└── pages/           # Route pages
```

ImageMagick is available. Let me create the PWA icons:


cd /media/Maind/zahrawi/dentistry/zikra-shelf/public && convert -background none -resize 192x192 book-shelf.svg pwa-192x192.png && convert -background none -resize 512x512 book-shelf.svg pwa-512x512.png && ls -la pwa*.png