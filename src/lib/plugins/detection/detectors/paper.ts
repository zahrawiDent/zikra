/**
 * Research Paper Resource Detector
 * 
 * Detects academic papers via DOI, PubMed IDs, arXiv IDs, and general
 * text that looks like paper titles for searching.
 */

import type { ResourceDetector, DetectionResult } from '../types';

/**
 * Academic identifier patterns
 */
const PAPER_PATTERNS = {
  // DOI: 10.xxxx/xxxxx
  doi: /^10\.\d{4,}(?:\.\d+)*\/[^\s]+$/,
  doiUrl: /(?:doi\.org|dx\.doi\.org)\/(.+)$/,
  
  // PubMed ID
  pmid: /^(?:PMID[:\s]?)?(\d{7,8})$/i,
  pubmedUrl: /(?:pubmed\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov\/pubmed)\/(\d+)/,
  
  // PubMed Central ID
  pmcid: /^PMC\d{6,8}$/i,
  pmcUrl: /ncbi\.nlm\.nih\.gov\/pmc\/articles\/(PMC\d+)/i,
  
  // arXiv ID
  arxiv: /^(?:arXiv:)?(\d{4}\.\d{4,5}(?:v\d+)?)$/i,
  arxivUrl: /arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/,
  
  // ResearchGate, Academia.edu
  researchGate: /researchgate\.net\/publication\/(\d+)/,
  academia: /academia\.edu\/(\d+)/,
};

/**
 * Academic domain patterns
 */
const ACADEMIC_DOMAINS = [
  'doi.org',
  'dx.doi.org',
  'pubmed.',
  'ncbi.nlm.nih.gov',
  'arxiv.org',
  'researchgate.net',
  'academia.edu',
  'sciencedirect.com',
  'springer.com',
  'wiley.com',
  'nature.com',
  'science.org',
  'cell.com',
  'tandfonline.com',
  'sagepub.com',
  'oup.com', // Oxford University Press
  'bmj.com',
  'thelancet.com',
  'nejm.org',
];

/**
 * Extract DOI from input
 */
function extractDoi(input: string): string | null {
  // Direct DOI
  if (PAPER_PATTERNS.doi.test(input)) {
    return input;
  }
  
  // DOI URL
  const urlMatch = input.match(PAPER_PATTERNS.doiUrl);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  return null;
}

/**
 * Extract PubMed ID
 */
function extractPmid(input: string): string | null {
  const directMatch = input.match(PAPER_PATTERNS.pmid);
  if (directMatch) {
    return directMatch[1];
  }
  
  const urlMatch = input.match(PAPER_PATTERNS.pubmedUrl);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  return null;
}

/**
 * Extract arXiv ID
 */
function extractArxivId(input: string): string | null {
  const directMatch = input.match(PAPER_PATTERNS.arxiv);
  if (directMatch) {
    return directMatch[1];
  }
  
  const urlMatch = input.match(PAPER_PATTERNS.arxivUrl);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  return null;
}

/**
 * Check if URL is from an academic domain
 */
function isAcademicUrl(input: string): boolean {
  const lower = input.toLowerCase();
  return ACADEMIC_DOMAINS.some(domain => lower.includes(domain));
}

/**
 * Heuristics for paper title detection
 */
function getPaperTitleScore(input: string): number {
  let score = 15; // Base score
  
  const trimmed = input.trim();
  const wordCount = trimmed.split(/\s+/).length;
  
  // Papers often have longer titles
  if (wordCount >= 5 && wordCount <= 20) score += 15;
  if (wordCount >= 8 && wordCount <= 15) score += 10;
  
  // Academic/scientific keywords
  const paperKeywords = [
    'study', 'analysis', 'research', 'investigation', 'review',
    'systematic', 'meta-analysis', 'clinical', 'trial', 'randomized',
    'efficacy', 'effect', 'treatment', 'patient', 'case',
    'comparison', 'evaluation', 'assessment', 'outcomes',
    'in vitro', 'in vivo', 'prospective', 'retrospective',
    'cohort', 'longitudinal', 'cross-sectional',
    'dental', 'oral', 'periodontal', 'endodontic', 'orthodontic',
    'implant', 'restoration', 'caries', 'pulp', 'root canal',
  ];
  
  const lowerInput = trimmed.toLowerCase();
  let keywordMatches = 0;
  for (const keyword of paperKeywords) {
    if (lowerInput.includes(keyword)) {
      keywordMatches++;
    }
  }
  
  score += Math.min(keywordMatches * 10, 30);
  
  // Colon in title (common in academic papers)
  if (trimmed.includes(':')) score += 10;
  
  // "et al" pattern
  if (/et\s+al\.?/i.test(trimmed)) score += 20;
  
  return Math.min(score, 75);
}

/**
 * Paper resource detector implementation
 */
export const paperDetector: ResourceDetector = {
  id: 'paper',
  priority: 80, // High priority for identifiers

  detect(input: string): DetectionResult | null {
    // Check for DOI
    const doi = extractDoi(input);
    if (doi) {
      return {
        pluginId: 'paper',
        displayName: 'Research Paper (DOI)',
        confidence: 'definite',
        inputType: input.includes('://') ? 'url' : 'identifier',
        context: {
          extractedId: doi,
          matchedPattern: 'doi',
        },
      };
    }

    // Check for PubMed ID
    const pmid = extractPmid(input);
    if (pmid) {
      return {
        pluginId: 'paper',
        displayName: 'Research Paper (PubMed)',
        confidence: 'definite',
        inputType: input.includes('://') ? 'url' : 'identifier',
        context: {
          extractedId: pmid,
          matchedPattern: 'pmid',
        },
      };
    }

    // Check for arXiv ID
    const arxivId = extractArxivId(input);
    if (arxivId) {
      return {
        pluginId: 'paper',
        displayName: 'Research Paper (arXiv)',
        confidence: 'definite',
        inputType: input.includes('://') ? 'url' : 'identifier',
        context: {
          extractedId: arxivId,
          matchedPattern: 'arxiv',
        },
      };
    }

    // Check for academic URL
    if (isAcademicUrl(input)) {
      return {
        pluginId: 'paper',
        displayName: 'Research Paper',
        confidence: 'high',
        inputType: 'url',
        context: {
          matchedPattern: 'academic-url',
        },
      };
    }

    // Text that looks like a paper title
    const trimmed = input.trim();
    if (trimmed.length >= 10 && !trimmed.includes('://')) {
      const score = getPaperTitleScore(trimmed);
      
      if (score >= 35) {
        const confidence = score >= 55 ? 'medium' : 'low';
        return {
          pluginId: 'paper',
          displayName: 'Search Papers',
          confidence,
          inputType: 'search-query',
          context: {
            metadata: {
              titleScore: score,
            },
          },
        };
      }
    }

    return null;
  },

  detectAll(input: string): DetectionResult[] {
    const results: DetectionResult[] = [];
    
    // Definite matches
    const doi = extractDoi(input);
    if (doi) {
      results.push({
        pluginId: 'paper',
        displayName: 'Research Paper (DOI)',
        confidence: 'definite',
        inputType: 'identifier',
        context: { extractedId: doi, matchedPattern: 'doi' },
      });
    }

    const pmid = extractPmid(input);
    if (pmid) {
      results.push({
        pluginId: 'paper',
        displayName: 'Research Paper (PubMed)',
        confidence: 'definite',
        inputType: 'identifier',
        context: { extractedId: pmid, matchedPattern: 'pmid' },
      });
    }

    const arxivId = extractArxivId(input);
    if (arxivId) {
      results.push({
        pluginId: 'paper',
        displayName: 'Research Paper (arXiv)',
        confidence: 'definite',
        inputType: 'identifier',
        context: { extractedId: arxivId, matchedPattern: 'arxiv' },
      });
    }

    // Academic URL
    if (isAcademicUrl(input) && !doi && !pmid && !arxivId) {
      results.push({
        pluginId: 'paper',
        displayName: 'Research Paper',
        confidence: 'high',
        inputType: 'url',
      });
    }

    // Search option for text
    const trimmed = input.trim();
    if (trimmed.length >= 10 && !trimmed.includes('://') && results.length === 0) {
      results.push({
        pluginId: 'paper',
        displayName: 'Search Papers',
        confidence: 'low',
        inputType: 'search-query',
      });
    }

    return results;
  },
};
