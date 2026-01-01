/**
 * Detection Badges Component
 * 
 * Displays detected resource types as selectable badge/pill buttons.
 * Shows confidence indicators and allows user selection.
 */

import { type Component, For, Show, createMemo } from 'solid-js';
import { pluginRegistry, type DetectionResult, CONFIDENCE_SCORES } from '../lib/plugins';
import { Check, Sparkles, AlertCircle } from 'lucide-solid';

interface DetectionBadgesProps {
  /** All detected resource types */
  detections: DetectionResult[];
  
  /** Currently selected detection */
  selected: DetectionResult | null;
  
  /** Called when user selects a detection */
  onSelect: (detection: DetectionResult) => void;
  
  /** Whether to show confidence indicators */
  showConfidence?: boolean;
  
  /** Compact mode for inline display */
  compact?: boolean;
}

/**
 * Get confidence indicator color
 */
function getConfidenceColor(confidence: DetectionResult['confidence']): string {
  switch (confidence) {
    case 'definite': return '#22c55e'; // green
    case 'high': return '#3b82f6'; // blue
    case 'medium': return '#f59e0b'; // amber
    case 'low': return '#9ca3af'; // gray
  }
}

/**
 * Get confidence label
 */
function getConfidenceLabel(confidence: DetectionResult['confidence']): string {
  switch (confidence) {
    case 'definite': return 'Detected';
    case 'high': return 'Likely';
    case 'medium': return 'Possible';
    case 'low': return 'Search';
  }
}

export const DetectionBadges: Component<DetectionBadgesProps> = (props) => {
  // Sort detections by confidence
  const sortedDetections = createMemo(() => {
    return [...props.detections].sort((a, b) => 
      CONFIDENCE_SCORES[b.confidence] - CONFIDENCE_SCORES[a.confidence]
    );
  });

  // Get the primary (highest confidence) detection
  const primaryDetection = createMemo(() => sortedDetections()[0] || null);

  // Check if detection is selected
  const isSelected = (detection: DetectionResult) => {
    if (!props.selected) return false;
    return props.selected.pluginId === detection.pluginId && 
           props.selected.inputType === detection.inputType;
  };

  return (
    <Show when={props.detections.length > 0}>
      <div class={`flex flex-wrap gap-2 ${props.compact ? '' : 'mt-2'}`}>
        <For each={sortedDetections()}>
          {(detection, index) => {
            const plugin = () => pluginRegistry.get(detection.pluginId);
            const isPrimary = () => index() === 0;
            const selected = () => isSelected(detection);
            const confidenceColor = () => getConfidenceColor(detection.confidence);
            
            return (
              <button
                type="button"
                class={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-150 border-2
                  ${selected() 
                    ? 'ring-2 ring-offset-1' 
                    : 'hover:shadow-md'
                  }
                  ${isPrimary() && !selected()
                    ? 'animate-pulse-subtle'
                    : ''
                  }
                `}
                style={{
                  'background-color': selected() 
                    ? `${plugin()?.color || '#6b7280'}15` 
                    : 'white',
                  'border-color': selected() 
                    ? plugin()?.color || '#6b7280'
                    : `${plugin()?.color || '#6b7280'}40`,
                  color: plugin()?.color || '#6b7280',
                  '--tw-ring-color': plugin()?.color || '#6b7280',
                }}
                onClick={() => props.onSelect(detection)}
              >
                {/* Plugin icon */}
                <Show when={plugin()}>
                  {(() => {
                    const Icon = plugin()!.icon;
                    return <Icon class="w-4 h-4" />;
                  })()}
                </Show>
                
                {/* Display name */}
                <span>{detection.displayName}</span>
                
                {/* Confidence indicator */}
                <Show when={props.showConfidence && !props.compact}>
                  <span 
                    class="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      'background-color': `${confidenceColor()}20`,
                      color: confidenceColor(),
                    }}
                  >
                    {getConfidenceLabel(detection.confidence)}
                  </span>
                </Show>

                {/* Selected checkmark */}
                <Show when={selected()}>
                  <Check class="w-3.5 h-3.5" />
                </Show>

                {/* Primary indicator (sparkle) */}
                <Show when={isPrimary() && detection.confidence === 'definite' && !selected()}>
                  <Sparkles class="w-3.5 h-3.5" />
                </Show>
              </button>
            );
          }}
        </For>
      </div>
    </Show>
  );
};

/**
 * Compact detection indicator for showing under input field
 */
interface DetectionIndicatorProps {
  detection: DetectionResult | null;
  loading?: boolean;
}

export const DetectionIndicator: Component<DetectionIndicatorProps> = (props) => {
  const plugin = () => props.detection ? pluginRegistry.get(props.detection.pluginId) : null;
  
  return (
    <div class="h-6 flex items-center">
      <Show when={props.loading}>
        <span class="text-xs text-gray-400 flex items-center gap-1">
          <span class="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          Detecting...
        </span>
      </Show>
      
      <Show when={!props.loading && props.detection}>
        <div 
          class="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: plugin()?.color || '#6b7280' }}
        >
          <Show when={plugin()}>
            {(() => {
              const Icon = plugin()!.icon;
              return <Icon class="w-3.5 h-3.5" />;
            })()}
          </Show>
          <span>{props.detection!.displayName}</span>
          <Show when={props.detection!.confidence === 'definite'}>
            <Check class="w-3 h-3 text-green-500" />
          </Show>
          <Show when={props.detection!.confidence === 'low'}>
            <AlertCircle class="w-3 h-3 text-gray-400" />
          </Show>
        </div>
      </Show>
      
      <Show when={!props.loading && !props.detection}>
        <span class="text-xs text-gray-400">
          Enter a URL, title, ISBN, DOI, or search term
        </span>
      </Show>
    </div>
  );
};
