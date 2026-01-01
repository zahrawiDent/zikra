/**
 * Resource Detection Engine - Type Definitions
 * 
 * A modular, extensible architecture for auto-detecting resource types
 * from user input (URLs, text, identifiers).
 */

import type { ResourcePlugin, FetchedResourceData, SearchResult } from '../types';

/**
 * Confidence level for resource detection
 * - definite: 100% match (e.g., YouTube URL pattern)
 * - high: Very likely match (e.g., DOI pattern)
 * - medium: Probable match (e.g., looks like a book title)
 * - low: Possible match (e.g., any text could be searched)
 */
export type DetectionConfidence = 'definite' | 'high' | 'medium' | 'low';

/**
 * Numeric confidence scores for sorting
 */
export const CONFIDENCE_SCORES: Record<DetectionConfidence, number> = {
  definite: 100,
  high: 80,
  medium: 50,
  low: 20,
};

/**
 * The type of input detected
 */
export type InputType = 
  | 'url'           // Direct URL
  | 'identifier'    // DOI, ISBN, video ID, etc.
  | 'search-query'  // Text to search for
  | 'title';        // Resource title

/**
 * Result from detecting what type of resource the input might be
 */
export interface DetectionResult {
  /** The plugin that can handle this input */
  pluginId: string;
  
  /** Display name for the detected type */
  displayName: string;
  
  /** Confidence level of the detection */
  confidence: DetectionConfidence;
  
  /** What type of input was detected */
  inputType: InputType;
  
  /** Additional context about the detection */
  context?: {
    /** Extracted identifier (video ID, DOI, ISBN, etc.) */
    extractedId?: string;
    /** Matched pattern name for debugging */
    matchedPattern?: string;
    /** Any additional metadata */
    metadata?: Record<string, unknown>;
  };
}

/**
 * Interface for resource type detectors
 * Each detector is responsible for identifying if input matches its resource type
 */
export interface ResourceDetector {
  /** Unique identifier for this detector (usually matches plugin id) */
  id: string;
  
  /** Priority for detection order (higher = checked first) */
  priority: number;
  
  /**
   * Detect if the input matches this resource type
   * @param input - User input (URL, text, etc.)
   * @returns Detection result if matched, null if not
   */
  detect(input: string): DetectionResult | null;
  
  /**
   * Get all possible detections for this input (for showing alternatives)
   * @param input - User input
   * @returns All possible detections, even low confidence ones
   */
  detectAll?(input: string): DetectionResult[];
}

/**
 * Configuration for the detection engine
 */
export interface DetectionEngineConfig {
  /** Minimum confidence level to show in suggestions */
  minConfidence: DetectionConfidence;
  
  /** Maximum number of suggestions to show */
  maxSuggestions: number;
  
  /** Debounce delay for input detection (ms) */
  debounceMs: number;
}

/**
 * Detection engine state
 */
export interface DetectionState {
  /** Current input value */
  input: string;
  
  /** Whether detection is in progress */
  detecting: boolean;
  
  /** All detected resource types */
  detections: DetectionResult[];
  
  /** Currently selected detection (auto or user-selected) */
  selectedDetection: DetectionResult | null;
  
  /** Error message if detection failed */
  error: string | null;
}

/**
 * Mode for adding resources
 */
export type AddMode = 'auto' | 'manual';

/**
 * Enhanced plugin interface with detection capabilities
 */
export interface DetectablePlugin extends ResourcePlugin {
  /** Create a detector for this plugin */
  createDetector(): ResourceDetector;
}
