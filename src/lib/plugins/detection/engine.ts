/**
 * Resource Detection Engine
 * 
 * Central registry for resource detectors with sophisticated
 * multi-detection and confidence scoring capabilities.
 */

import {
  type ResourceDetector,
  type DetectionResult,
  type DetectionEngineConfig,
  type DetectionConfidence,
  CONFIDENCE_SCORES,
} from './types';

/**
 * Default configuration for the detection engine
 */
const DEFAULT_CONFIG: DetectionEngineConfig = {
  minConfidence: 'low',
  maxSuggestions: 5,
  debounceMs: 300,
};

/**
 * Detection Engine - manages resource type detection
 */
export class DetectionEngine {
  private detectors: Map<string, ResourceDetector> = new Map();
  private config: DetectionEngineConfig;

  constructor(config: Partial<DetectionEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a detector
   */
  register(detector: ResourceDetector): void {
    this.detectors.set(detector.id, detector);
  }

  /**
   * Unregister a detector
   */
  unregister(id: string): void {
    this.detectors.delete(id);
  }

  /**
   * Get all registered detectors
   */
  getAll(): ResourceDetector[] {
    return Array.from(this.detectors.values());
  }

  /**
   * Get detectors sorted by priority (highest first)
   */
  private getSortedDetectors(): ResourceDetector[] {
    return this.getAll().sort((a, b) => b.priority - a.priority);
  }

  /**
   * Detect the best matching resource type for the input
   * @returns The highest confidence detection, or null if no match
   */
  detect(input: string): DetectionResult | null {
    if (!input.trim()) return null;

    const results = this.detectAll(input);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Detect all possible resource types for the input
   * @returns All detections sorted by confidence (highest first)
   */
  detectAll(input: string): DetectionResult[] {
    if (!input.trim()) return [];

    const results: DetectionResult[] = [];
    const normalizedInput = input.trim();

    for (const detector of this.getSortedDetectors()) {
      // Try detectAll first if available
      if (detector.detectAll) {
        const detections = detector.detectAll(normalizedInput);
        results.push(...detections);
      } else {
        // Fall back to single detect
        const detection = detector.detect(normalizedInput);
        if (detection) {
          results.push(detection);
        }
      }
    }

    // Sort by confidence score (descending), then by priority
    return results
      .sort((a, b) => {
        const scoreA = CONFIDENCE_SCORES[a.confidence];
        const scoreB = CONFIDENCE_SCORES[b.confidence];
        return scoreB - scoreA;
      })
      .filter((result) => {
        const score = CONFIDENCE_SCORES[result.confidence];
        const minScore = CONFIDENCE_SCORES[this.config.minConfidence];
        return score >= minScore;
      })
      .slice(0, this.config.maxSuggestions);
  }

  /**
   * Check if the input matches a specific resource type
   */
  detectFor(input: string, pluginId: string): DetectionResult | null {
    const detector = this.detectors.get(pluginId);
    if (!detector) return null;
    return detector.detect(input.trim());
  }

  /**
   * Get the configuration
   */
  getConfig(): DetectionEngineConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<DetectionEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Global detection engine instance
 */
export const detectionEngine = new DetectionEngine();

/**
 * Utility: Determine the primary input category
 */
export function categorizeInput(input: string): 'url' | 'identifier' | 'text' {
  const trimmed = input.trim();
  
  // Check for URL patterns
  if (/^https?:\/\//i.test(trimmed)) {
    return 'url';
  }
  
  // Check for common identifier patterns
  if (
    /^10\.\d{4,}\//.test(trimmed) || // DOI
    /^(?:978|979)\d{10}$/.test(trimmed.replace(/-/g, '')) || // ISBN-13
    /^\d{9}[\dXx]$/.test(trimmed.replace(/-/g, '')) || // ISBN-10
    /^[a-zA-Z0-9_-]{11}$/.test(trimmed) // YouTube video ID
  ) {
    return 'identifier';
  }
  
  return 'text';
}
