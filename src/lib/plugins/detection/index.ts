/**
 * Detection Module Index
 * 
 * Exports the detection engine, types, and all detectors.
 * Handles automatic registration of built-in detectors.
 */

export * from './types';
export * from './engine';
export * from './detectors';

import { detectionEngine } from './engine';
import {
  youtubeDetector,
  articleDetector,
  bookDetector,
  paperDetector,
} from './detectors';

/**
 * Register all built-in detectors
 */
export function initializeDetectors(): void {
  detectionEngine.register(youtubeDetector);
  detectionEngine.register(paperDetector);
  detectionEngine.register(bookDetector);
  detectionEngine.register(articleDetector);
}
