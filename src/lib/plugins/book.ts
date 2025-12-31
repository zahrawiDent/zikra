// Google Books plugin - search and fetch book data
import type { ResourcePlugin, FetchedResourceData, SearchResult } from './types';
import { BookOpen } from 'lucide-solid';

interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    previewLink?: string;
    infoLink?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

async function searchBooks(query: string): Promise<SearchResult[]> {
  // Add "dentistry" or "dental" to improve relevance for dental students
  const searchQuery = encodeURIComponent(query);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=10`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to search books');
  }
  
  const data = await response.json();
  
  if (!data.items) {
    return [];
  }
  
  return data.items.map((item: GoogleBookVolume) => ({
    id: item.id,
    title: item.volumeInfo.title,
    description: item.volumeInfo.authors?.join(', ') || 'Unknown author',
    thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
    metadata: {
      volumeInfo: item.volumeInfo,
    },
  }));
}

async function getBookDetails(result: SearchResult): Promise<FetchedResourceData> {
  const volumeInfo = result.metadata.volumeInfo as GoogleBookVolume['volumeInfo'];
  
  // Get ISBN if available
  const isbn = volumeInfo.industryIdentifiers?.find(
    id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
  )?.identifier;
  
  return {
    title: volumeInfo.title + (volumeInfo.subtitle ? `: ${volumeInfo.subtitle}` : ''),
    description: volumeInfo.description?.slice(0, 500) || 'No description available',
    url: volumeInfo.infoLink,
    thumbnail: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
    metadata: {
      googleBooksId: result.id,
      authors: volumeInfo.authors || [],
      publisher: volumeInfo.publisher,
      publishedDate: volumeInfo.publishedDate,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories || [],
      isbn,
      previewLink: volumeInfo.previewLink,
    },
  };
}

export const bookPlugin: ResourcePlugin = {
  id: 'book',
  name: 'Book',
  icon: BookOpen,
  color: '#8b5cf6',
  inputType: 'search',
  placeholder: 'Search for a book title or author...',
  
  validate: (input: string) => input.trim().length >= 2,
  
  search: searchBooks,
  getDetails: getBookDetails,
};
