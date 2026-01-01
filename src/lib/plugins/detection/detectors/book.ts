/**
 * Book Resource Detector
 * 
 * Detects book-related input: ISBNs, Google Books URLs, and general text
 * that could be book titles/authors for searching.
 */

import type { ResourceDetector, DetectionResult } from '../types';

/**
 * ISBN patterns
 */
const ISBN_PATTERNS = {
  // ISBN-13: 978 or 979 prefix, 10 digits
  isbn13: /^(?:978|979)[\d-]{10,14}$/,
  isbn13Strict: /^(978|979)\d{10}$/,
  // ISBN-10: 9 digits + check digit (0-9 or X)
  isbn10: /^[\d-]{9,13}[\dXx]$/,
  isbn10Strict: /^\d{9}[\dXx]$/,
};

/**
 * Google Books URL pattern
 */
const GOOGLE_BOOKS_PATTERN = /books\.google\.com\/books\?id=([a-zA-Z0-9_-]+)/;

/**
 * Clean ISBN by removing dashes and spaces
 */
function cleanIsbn(input: string): string {
  return input.replace(/[-\s]/g, '');
}

/**
 * Validate ISBN-10 check digit
 */
function validateIsbn10(isbn: string): boolean {
  if (isbn.length !== 10) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i], 10) * (10 - i);
  }
  
  const checkDigit = isbn[9].toUpperCase();
  const checkValue = checkDigit === 'X' ? 10 : parseInt(checkDigit, 10);
  sum += checkValue;
  
  return sum % 11 === 0;
}

/**
 * Validate ISBN-13 check digit
 */
function validateIsbn13(isbn: string): boolean {
  if (isbn.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(isbn[12], 10);
}

/**
 * Detect ISBN from input
 */
function detectIsbn(input: string): { type: 'isbn-10' | 'isbn-13'; value: string; valid: boolean } | null {
  const cleaned = cleanIsbn(input);
  
  if (ISBN_PATTERNS.isbn13Strict.test(cleaned)) {
    return {
      type: 'isbn-13',
      value: cleaned,
      valid: validateIsbn13(cleaned),
    };
  }
  
  if (ISBN_PATTERNS.isbn10Strict.test(cleaned)) {
    return {
      type: 'isbn-10',
      value: cleaned,
      valid: validateIsbn10(cleaned),
    };
  }
  
  return null;
}

/**
 * Detect Google Books URL
 */
function detectGoogleBooksUrl(input: string): string | null {
  const match = input.match(GOOGLE_BOOKS_PATTERN);
  return match ? match[1] : null;
}

/**
 * Heuristics for book title detection
 * Returns a score from 0-100 indicating how likely the text is a book title
 */
function getBookTitleScore(input: string): number {
  let score = 20; // Base score for any text (can be searched)
  
  const trimmed = input.trim();
  const wordCount = trimmed.split(/\s+/).length;
  
  // Optimal title length (2-7 words)
  if (wordCount >= 2 && wordCount <= 7) score += 15;
  if (wordCount >= 3 && wordCount <= 5) score += 10;
  
  // Title case detection
  const words = trimmed.split(/\s+/);
  const titleCaseWords = words.filter(w => /^[A-Z]/.test(w)).length;
  if (titleCaseWords / words.length > 0.5) score += 10;
  
  // Common book-related keywords
  const bookKeywords = [
    'edition', 'textbook', 'handbook', 'manual', 'guide',
    'introduction', 'principles', 'fundamentals', 'clinical',
    'anatomy', 'physiology', 'pathology', 'surgery', 'medicine',
    'dentistry', 'dental', 'orthodontics', 'endodontics',
  ];
  
  const lowerInput = trimmed.toLowerCase();
  for (const keyword of bookKeywords) {
    if (lowerInput.includes(keyword)) {
      score += 15;
      break;
    }
  }
  
  // Quoted text (user explicitly indicating a title)
  if (/^["'].*["']$/.test(trimmed)) score += 20;
  
  // "by Author" pattern
  if (/\bby\s+[A-Z]/i.test(trimmed)) score += 15;
  
  return Math.min(score, 80); // Cap at 80 (not definite)
}

/**
 * Book resource detector implementation
 */
export const bookDetector: ResourceDetector = {
  id: 'book',
  priority: 60, // Higher than paper for text input

  detect(input: string): DetectionResult | null {
    // Check for ISBN
    const isbnResult = detectIsbn(input);
    if (isbnResult) {
      return {
        pluginId: 'book',
        displayName: `Book (${isbnResult.type.toUpperCase()})`,
        confidence: isbnResult.valid ? 'definite' : 'high',
        inputType: 'identifier',
        context: {
          extractedId: isbnResult.value,
          matchedPattern: isbnResult.type,
          metadata: {
            isbnValid: isbnResult.valid,
          },
        },
      };
    }

    // Check for Google Books URL
    const googleBooksId = detectGoogleBooksUrl(input);
    if (googleBooksId) {
      return {
        pluginId: 'book',
        displayName: 'Book (Google Books)',
        confidence: 'definite',
        inputType: 'url',
        context: {
          extractedId: googleBooksId,
          matchedPattern: 'google-books-url',
        },
      };
    }

    // For plain text, calculate book title likelihood
    const trimmed = input.trim();
    if (trimmed.length >= 3 && !trimmed.includes('://')) {
      const score = getBookTitleScore(trimmed);
      
      // Only return if score indicates reasonable book likelihood
      if (score >= 35) {
        const confidence = score >= 60 ? 'medium' : 'low';
        return {
          pluginId: 'book',
          displayName: 'Search Books',
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
    
    // Always check for definite matches first
    const isbnResult = detectIsbn(input);
    if (isbnResult) {
      results.push({
        pluginId: 'book',
        displayName: `Book (${isbnResult.type.toUpperCase()})`,
        confidence: isbnResult.valid ? 'definite' : 'high',
        inputType: 'identifier',
        context: {
          extractedId: isbnResult.value,
          matchedPattern: isbnResult.type,
        },
      });
    }

    const googleBooksId = detectGoogleBooksUrl(input);
    if (googleBooksId) {
      results.push({
        pluginId: 'book',
        displayName: 'Book (Google Books)',
        confidence: 'definite',
        inputType: 'url',
        context: {
          extractedId: googleBooksId,
          matchedPattern: 'google-books-url',
        },
      });
    }

    // Add search option for text input
    const trimmed = input.trim();
    if (trimmed.length >= 3 && !trimmed.includes('://') && !isbnResult) {
      results.push({
        pluginId: 'book',
        displayName: 'Search Books',
        confidence: 'low',
        inputType: 'search-query',
      });
    }

    return results;
  },
};
