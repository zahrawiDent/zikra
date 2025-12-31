// Research Paper plugin - search PubMed/CrossRef for papers
import type { ResourcePlugin, FetchedResourceData, SearchResult } from './types';
import { FileText } from 'lucide-solid';

interface CrossRefWork {
  DOI: string;
  title: string[];
  author?: Array<{
    given?: string;
    family?: string;
  }>;
  'container-title'?: string[];
  published?: {
    'date-parts'?: number[][];
  };
  abstract?: string;
  URL?: string;
  type?: string;
}

async function searchPapers(query: string): Promise<SearchResult[]> {
  // Use CrossRef API (free, no key needed)
  const searchQuery = encodeURIComponent(query);
  const url = `https://api.crossref.org/works?query=${searchQuery}&rows=10&select=DOI,title,author,container-title,published,abstract,URL,type`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DentistryStudyHub/1.0 (mailto:student@example.com)',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to search papers');
    }
    
    const data = await response.json();
    
    if (!data.message?.items) {
      return [];
    }
    
    return data.message.items.map((item: CrossRefWork) => {
      const authors = item.author
        ?.map(a => `${a.given || ''} ${a.family || ''}`.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(', ');
      
      return {
        id: item.DOI,
        title: item.title?.[0] || 'Untitled',
        description: authors || 'Unknown authors',
        metadata: { work: item },
      };
    });
  } catch (error) {
    console.error('Paper search error:', error);
    return [];
  }
}

async function getPaperDetails(result: SearchResult): Promise<FetchedResourceData> {
  const work = result.metadata.work as CrossRefWork;
  
  const authors = work.author
    ?.map(a => `${a.given || ''} ${a.family || ''}`.trim())
    .filter(Boolean) || [];
  
  const year = work.published?.['date-parts']?.[0]?.[0];
  const journal = work['container-title']?.[0];
  
  // Clean abstract (remove JATS tags if present)
  let abstract = work.abstract || '';
  abstract = abstract.replace(/<[^>]*>/g, '').trim();
  
  return {
    title: work.title?.[0] || 'Untitled',
    description: abstract.slice(0, 500) || 'No abstract available',
    url: work.URL || `https://doi.org/${work.DOI}`,
    metadata: {
      doi: work.DOI,
      authors,
      journal,
      year,
      type: work.type,
    },
  };
}

export const paperPlugin: ResourcePlugin = {
  id: 'paper',
  name: 'Research Paper',
  icon: FileText,
  color: '#06b6d4',
  inputType: 'search',
  placeholder: 'Search for research papers by title, author, or topic...',
  
  validate: (input: string) => input.trim().length >= 3,
  
  search: searchPapers,
  getDetails: getPaperDetails,
};
