/**
 * Detection State Hook
 * 
 * Custom hook for managing resource detection state in components.
 */

import { createSignal, createEffect, onCleanup } from 'solid-js';
import { detectionEngine, type DetectionResult } from '../../lib/plugins';

export interface UseDetectionOptions {
  /** Debounce delay in ms */
  debounceMs?: number;
  
  /** Whether to auto-select the highest confidence detection */
  autoSelect?: boolean;
  
  /** Initial input value */
  initialValue?: string;
}

export interface UseDetectionReturn {
  /** Current input value */
  input: () => string;
  
  /** Set input value */
  setInput: (value: string) => void;
  
  /** Whether detection is in progress */
  detecting: () => boolean;
  
  /** All detected resource types */
  detections: () => DetectionResult[];
  
  /** Currently selected detection */
  selectedDetection: () => DetectionResult | null;
  
  /** Select a detection */
  selectDetection: (detection: DetectionResult | null) => void;
  
  /** Clear all state */
  clear: () => void;
  
  /** Force run detection now */
  detectNow: () => void;
}

/**
 * Hook for managing detection state
 */
export function useDetection(options: UseDetectionOptions = {}): UseDetectionReturn {
  const {
    debounceMs = 300,
    autoSelect = true,
    initialValue = '',
  } = options;

  const [input, setInput] = createSignal(initialValue);
  const [detecting, setDetecting] = createSignal(false);
  const [detections, setDetections] = createSignal<DetectionResult[]>([]);
  const [selectedDetection, setSelectedDetection] = createSignal<DetectionResult | null>(null);
  
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Run detection with debounce
  const runDetection = (value: string, immediate = false) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    const trimmed = value.trim();
    
    if (!trimmed) {
      setDetections([]);
      setSelectedDetection(null);
      setDetecting(false);
      return;
    }

    setDetecting(true);

    const doDetection = () => {
      const results = detectionEngine.detectAll(trimmed);
      setDetections(results);
      
      if (autoSelect && results.length > 0) {
        // Keep current selection if it's still valid
        const current = selectedDetection();
        const stillValid = current && results.some(
          r => r.pluginId === current.pluginId && r.inputType === current.inputType
        );
        
        if (!stillValid) {
          setSelectedDetection(results[0]);
        }
      } else if (results.length === 0) {
        setSelectedDetection(null);
      }
      
      setDetecting(false);
    };

    if (immediate) {
      doDetection();
    } else {
      debounceTimer = setTimeout(doDetection, debounceMs);
    }
  };

  // React to input changes
  createEffect(() => {
    runDetection(input());
  });

  // Cleanup
  onCleanup(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  // Clear all state
  const clear = () => {
    setInput('');
    setDetections([]);
    setSelectedDetection(null);
    setDetecting(false);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  // Force immediate detection
  const detectNow = () => {
    runDetection(input(), true);
  };

  return {
    input,
    setInput,
    detecting,
    detections,
    selectedDetection,
    selectDetection: setSelectedDetection,
    clear,
    detectNow,
  };
}
