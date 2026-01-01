/**
 * Auto-Detect Input Component
 * 
 * A unified input field that automatically detects resource types
 * as the user types, with debounced detection and visual feedback.
 */

import { 
  type Component, 
  createSignal, 
  createEffect, 
  onCleanup,
  Show,
  splitProps
} from 'solid-js';
import { detectionEngine, type DetectionResult } from '../lib/plugins';
import { DetectionIndicator, DetectionBadges } from './DetectionBadges';
import { Search, X, Wand2 } from 'lucide-solid';

interface AutoDetectInputProps {
  /** Current input value */
  value: string;
  
  /** Called when input changes */
  onInput: (value: string) => void;
  
  /** All detected resource types */
  detections: DetectionResult[];
  
  /** Called when detections change */
  onDetectionsChange: (detections: DetectionResult[]) => void;
  
  /** Currently selected detection */
  selectedDetection: DetectionResult | null;
  
  /** Called when user selects a detection */
  onDetectionSelect: (detection: DetectionResult) => void;
  
  /** Called when user presses Enter or clicks submit */
  onSubmit: () => void;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Debounce delay in ms */
  debounceMs?: number;
  
  /** Autofocus the input */
  autofocus?: boolean;
  
  /** Whether detection is in auto mode */
  autoMode?: boolean;
  
  /** Disable the input */
  disabled?: boolean;
}

export const AutoDetectInput: Component<AutoDetectInputProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'value', 'onInput', 'detections', 'onDetectionsChange',
    'selectedDetection', 'onDetectionSelect', 'onSubmit',
    'placeholder', 'debounceMs', 'autofocus', 'autoMode', 'disabled'
  ]);

  const [detecting, setDetecting] = createSignal(false);
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | null>(null);
  
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Debounced detection
  const runDetection = (value: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!value.trim()) {
      local.onDetectionsChange([]);
      return;
    }

    setDetecting(true);
    
    debounceTimer = setTimeout(() => {
      const results = detectionEngine.detectAll(value);
      local.onDetectionsChange(results);
      
      // Auto-select the highest confidence detection
      if (results.length > 0 && local.autoMode !== false) {
        // Only auto-select if no current selection or input changed significantly
        if (!local.selectedDetection || 
            !results.some(r => r.pluginId === local.selectedDetection?.pluginId)) {
          local.onDetectionSelect(results[0]);
        }
      }
      
      setDetecting(false);
    }, local.debounceMs ?? 300);
  };

  // Run detection when value changes
  createEffect(() => {
    runDetection(local.value);
  });

  // Cleanup
  onCleanup(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  // Handle input change
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    local.onInput(target.value);
  };

  // Handle key press
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && local.selectedDetection) {
      e.preventDefault();
      local.onSubmit();
    }
  };

  // Clear input
  const handleClear = () => {
    local.onInput('');
    local.onDetectionsChange([]);
    inputRef()?.focus();
  };

  // Determine if we can submit (have a valid selection)
  const canSubmit = () => {
    return local.value.trim().length > 0 && local.selectedDetection !== null;
  };

  return (
    <div class="space-y-3">
      {/* Input field with clear button and submit */}
      <div class="relative">
        <div class="flex gap-2">
          <div class="relative flex-1">
            <input
              ref={setInputRef}
              type="text"
              value={local.value}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={local.placeholder ?? "Paste URL, enter title, ISBN, DOI, or search..."}
              disabled={local.disabled}
              autofocus={local.autofocus}
              class={`
                w-full px-4 py-3 pr-10 
                border-2 border-gray-200 rounded-xl
                text-gray-900 placeholder-gray-400
                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                transition-all duration-150
                ${local.disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
              `}
            />
            
            {/* Clear button */}
            <Show when={local.value.length > 0}>
              <button
                type="button"
                onClick={handleClear}
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </Show>
          </div>
          
          {/* Submit button */}
          <button
            type="button"
            onClick={local.onSubmit}
            disabled={!canSubmit() || local.disabled}
            class={`
              px-4 py-3 rounded-xl font-medium
              flex items-center gap-2
              transition-all duration-150
              ${canSubmit()
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Show when={detecting()}>
              <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </Show>
            <Show when={!detecting()}>
              <Wand2 class="w-4 h-4" />
            </Show>
            <span class="hidden sm:inline">
              {detecting() ? 'Detecting...' : 'Continue'}
            </span>
          </button>
        </div>
      </div>

      {/* Detection indicator (compact, shows primary detection) */}
      <DetectionIndicator 
        detection={local.selectedDetection} 
        loading={detecting()} 
      />

      {/* Detection badges (when multiple options available) */}
      <Show when={local.detections.length > 1}>
        <div class="pt-1">
          <p class="text-xs text-gray-500 mb-2">
            Multiple types detected. Select one:
          </p>
          <DetectionBadges
            detections={local.detections}
            selected={local.selectedDetection}
            onSelect={local.onDetectionSelect}
            showConfidence
          />
        </div>
      </Show>
    </div>
  );
};
