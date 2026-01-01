/**
 * Add Resource Modal - Redesigned
 * 
 * Seamless resource addition with auto-detection and minimal friction.
 * Features:
 * - Auto mode: Automatically detects resource type from input
 * - Manual mode: User selects type and enters details manually
 * - Smart detection badges for ambiguous inputs
 * - Streamlined single-input flow
 * - Hierarchical category/topic selection
 */

import { type Component, createSignal, createEffect, Show, For } from 'solid-js';
import { Modal, Button, Input, Textarea, ThumbnailInput } from './ui';
import { CategoryTopicSelector } from './CategoryTopicSelector';
import { AutoDetectInput } from './AutoDetectInput';
import { 
  pluginRegistry, 
  type SearchResult, 
  type FetchedResourceData,
  type DetectionResult 
} from '../lib/plugins';
import { createResource } from '../lib/db/actions';
import { downloadAndSaveThumbnail, isLocalThumbnail } from '../lib/db/thumbnails';
import { useDetection } from '../lib/hooks';
import type { CategoryTopicMap } from '../lib/db/schema';
import { 
  LoaderCircle, 
  Check, 
  PenLine, 
  Wand2, 
  ArrowLeft,
  Sparkles,
  Settings2
} from 'lucide-solid';
import type { ExtensionResourceData } from '../app';

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: ExtensionResourceData | null;
}

/**
 * Modal steps - simplified flow
 */
type Step = 
  | 'input'          // Main input with auto-detection
  | 'search-results' // For search-based plugins
  | 'preview'        // Review fetched data before saving
  | 'saving'         // Saving in progress
  | 'manual-entry';  // Manual entry mode

/**
 * Mode for adding resources
 */
type AddMode = 'auto' | 'manual';

export const AddResourceModal: Component<AddResourceModalProps> = (props) => {
  // Detection hook for auto mode
  const detection = useDetection({ debounceMs: 300, autoSelect: true });
  
  // Step management
  const [step, setStep] = createSignal<Step>('input');
  const [mode, setMode] = createSignal<AddMode>('auto');
  
  // Data state
  const [searchResults, setSearchResults] = createSignal<SearchResult[]>([]);
  const [fetchedData, setFetchedData] = createSignal<FetchedResourceData | null>(null);
  const [selectedCategoryTopics, setSelectedCategoryTopics] = createSignal<CategoryTopicMap>({});
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  
  // Manual entry state
  const [manualTitle, setManualTitle] = createSignal('');
  const [manualDescription, setManualDescription] = createSignal('');
  const [manualUrl, setManualUrl] = createSignal('');
  const [manualThumbnail, setManualThumbnail] = createSignal('');
  const [manualType, setManualType] = createSignal<string>('article');

  const plugins = () => pluginRegistry.getAll();
  
  // Get current plugin based on detection
  const currentPlugin = () => {
    const det = detection.selectedDetection();
    return det ? pluginRegistry.get(det.pluginId) : null;
  };

  // Reset state when modal closes, or handle extension data
  createEffect(() => {
    if (!props.open) {
      // Reset everything
      setStep('input');
      setMode('auto');
      detection.clear();
      setSearchResults([]);
      setFetchedData(null);
      setSelectedCategoryTopics({});
      setError(null);
      setLoading(false);
      // Reset manual entry fields
      setManualTitle('');
      setManualDescription('');
      setManualUrl('');
      setManualThumbnail('');
      setManualType('article');
    } else if (props.initialData) {
      // Pre-fill from extension data (new format: just URL + hints)
      // Set the URL in detection input - this will auto-detect the type
      detection.setInput(props.initialData.url);
      
      // Auto-submit after a short delay to let detection run
      setTimeout(async () => {
        const det = detection.selectedDetection();
        if (det) {
          // Auto-fetch the resource data
          await handleAutoSubmit();
        }
      }, 500);
    }
  });

  // Handle input submission in auto mode
  const handleAutoSubmit = async () => {
    const det = detection.selectedDetection();
    const plugin = currentPlugin();
    
    if (!det || !plugin) {
      setError('Please enter a valid URL or search term');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input = detection.input();
      
      // URL-based plugins: fetch data directly
      if (plugin.inputType === 'url' && plugin.fetchFromUrl) {
        // Normalize URL if needed
        let url = input;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          // Check if it looks like a bare video ID or needs protocol
          if (det.context?.metadata?.needsProtocol) {
            url = `https://${url}`;
          }
        }
        
        let data = await plugin.fetchFromUrl(url);
        
        // Use extension hints as fallback for missing data
        const hints = props.initialData?.hints;
        if (hints) {
          data = {
            ...data,
            title: data.title || hints.title || 'Untitled',
            description: data.description || hints.description,
            thumbnail: data.thumbnail || hints.thumbnail,
          };
        }
        
        setFetchedData(data);
        setStep('preview');
      }
      // Search-based plugins: perform search
      else if (plugin.inputType === 'search' && plugin.search) {
        const results = await plugin.search(input);
        setSearchResults(results);
        setStep('search-results');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      
      // If fetch failed but we have extension hints, use them as fallback
      const hints = props.initialData?.hints;
      if (hints && (hints.title || hints.description)) {
        setFetchedData({
          title: hints.title || 'Untitled',
          description: hints.description,
          url: detection.input(),
          thumbnail: hints.thumbnail,
          metadata: {},
        });
        setStep('preview');
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch resource data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = async (result: SearchResult) => {
    const plugin = currentPlugin();
    if (!plugin?.getDetails) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await plugin.getDetails(result);
      setFetchedData(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get details');
    } finally {
      setLoading(false);
    }
  };

  // Handle save (both auto and manual)
  const handleSave = async () => {
    const data = fetchedData();
    const plugin = currentPlugin();
    
    if (!data || !plugin) return;

    setStep('saving');
    try {
      // Download thumbnail locally if it's a remote URL
      let thumbnailUrl = data.thumbnail || '';
      if (thumbnailUrl && !isLocalThumbnail(thumbnailUrl)) {
        try {
          thumbnailUrl = await downloadAndSaveThumbnail(thumbnailUrl);
        } catch (err) {
          console.warn('Failed to download thumbnail, using original URL:', err);
        }
      }

      createResource({
        type: plugin.id,
        title: data.title,
        description: data.description,
        url: data.url,
        thumbnail: thumbnailUrl,
        metadata: data.metadata,
        categoryTopics: selectedCategoryTopics(),
        status: 'to-study',
      });
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStep('preview');
    }
  };

  // Handle manual save
  const handleManualSave = async () => {
    if (!manualTitle().trim()) {
      setError('Title is required');
      return;
    }

    setStep('saving');
    try {
      let thumbnailUrl = manualThumbnail();
      if (thumbnailUrl && !isLocalThumbnail(thumbnailUrl)) {
        try {
          thumbnailUrl = await downloadAndSaveThumbnail(thumbnailUrl);
        } catch (err) {
          console.warn('Failed to download thumbnail, using original URL:', err);
        }
      }

      createResource({
        type: manualType(),
        title: manualTitle().trim(),
        description: manualDescription().trim(),
        url: manualUrl().trim(),
        thumbnail: thumbnailUrl,
        metadata: {},
        categoryTopics: selectedCategoryTopics(),
        status: 'to-study',
      });
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStep('manual-entry');
    }
  };

  // Go back to input step
  const goBack = () => {
    setError(null);
    setStep('input');
  };

  // Switch to manual mode
  const switchToManual = () => {
    setMode('manual');
    setStep('manual-entry');
    // Pre-fill manual URL if we have input
    if (detection.input()) {
      const input = detection.input();
      if (input.includes('://') || input.includes('.')) {
        setManualUrl(input);
      } else {
        setManualTitle(input);
      }
    }
  };

  // Switch to auto mode
  const switchToAuto = () => {
    setMode('auto');
    setStep('input');
  };

  return (
    <Modal open={props.open} onClose={props.onClose} title="Add Resource" size="lg">
      {/* Mode toggle in header area */}
      <Show when={step() === 'input' || step() === 'manual-entry'}>
        <div class="flex items-center justify-between mb-4 pb-3 border-b">
          <div class="flex items-center gap-2">
            <Show when={mode() === 'auto'}>
              <Sparkles class="w-4 h-4 text-blue-500" />
              <span class="text-sm font-medium text-gray-700">Auto Detect Mode</span>
            </Show>
            <Show when={mode() === 'manual'}>
              <Settings2 class="w-4 h-4 text-gray-500" />
              <span class="text-sm font-medium text-gray-700">Manual Entry Mode</span>
            </Show>
          </div>
          
          <button
            type="button"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            onClick={() => mode() === 'auto' ? switchToManual() : switchToAuto()}
          >
            <Show when={mode() === 'auto'}>
              <PenLine class="w-3.5 h-3.5" />
              <span>Manual Entry</span>
            </Show>
            <Show when={mode() === 'manual'}>
              <Wand2 class="w-3.5 h-3.5" />
              <span>Auto Detect</span>
            </Show>
          </button>
        </div>
      </Show>

      {/* Step: Main Input (Auto Mode) */}
      <Show when={step() === 'input' && mode() === 'auto'}>
        <div class="space-y-4">
          <AutoDetectInput
            value={detection.input()}
            onInput={detection.setInput}
            detections={detection.detections()}
            onDetectionsChange={() => {}} // Handled by hook
            selectedDetection={detection.selectedDetection()}
            onDetectionSelect={detection.selectDetection}
            onSubmit={handleAutoSubmit}
            autofocus
            disabled={loading()}
          />
          
          <Show when={error()}>
            <p class="text-sm text-red-600">{error()}</p>
          </Show>

          {/* Quick type selection for text input */}
          <Show when={detection.detections().length === 0 && detection.input().length > 2}>
            <div class="pt-2">
              <p class="text-sm text-gray-500 mb-2">Or search as:</p>
              <div class="flex flex-wrap gap-2">
                <For each={plugins().filter(p => p.inputType === 'search')}>
                  {(plugin) => (
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 hover:shadow-sm transition-all"
                      style={{
                        'border-color': `${plugin.color}40`,
                        color: plugin.color,
                      }}
                      onClick={() => {
                        // Force select this plugin type
                        const fakeDetection: DetectionResult = {
                          pluginId: plugin.id,
                          displayName: plugin.name,
                          confidence: 'low',
                          inputType: 'search-query',
                        };
                        detection.selectDetection(fakeDetection);
                      }}
                    >
                      {(() => {
                        const Icon = plugin.icon;
                        return <Icon class="w-4 h-4" />;
                      })()}
                      <span>{plugin.name}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Step: Search Results */}
      <Show when={step() === 'search-results'}>
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <button
              type="button"
              class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              onClick={goBack}
            >
              <ArrowLeft class="w-4 h-4" />
              Back
            </button>
            <span class="text-sm text-gray-600">
              Select from {searchResults().length} results
            </span>
          </div>
          
          <Show when={searchResults().length === 0}>
            <div class="text-center py-8">
              <p class="text-gray-500">No results found</p>
              <button
                type="button"
                class="mt-2 text-sm text-blue-600 hover:text-blue-700"
                onClick={goBack}
              >
                Try a different search
              </button>
            </div>
          </Show>
          
          <div class="space-y-2 max-h-80 overflow-y-auto">
            <For each={searchResults()}>
              {(result) => (
                <button
                  type="button"
                  class="w-full flex items-start gap-3 p-3 border rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => handleSearchResultSelect(result)}
                  disabled={loading()}
                >
                  <Show when={result.thumbnail}>
                    <img
                      src={result.thumbnail}
                      alt=""
                      class="w-12 h-16 object-cover rounded"
                    />
                  </Show>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">{result.title}</p>
                    <p class="text-sm text-gray-500 truncate">{result.description}</p>
                  </div>
                  <Show when={loading()}>
                    <LoaderCircle class="w-4 h-4 animate-spin text-gray-400" />
                  </Show>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Step: Preview */}
      <Show when={step() === 'preview'}>
        <div class="space-y-4">
          <Show when={!props.initialData}>
            <div class="flex items-center gap-2 mb-4">
              <button
                type="button"
                class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                onClick={() => {
                  if (currentPlugin()?.inputType === 'search') {
                    setStep('search-results');
                  } else {
                    goBack();
                  }
                }}
              >
                <ArrowLeft class="w-4 h-4" />
                Back
              </button>
              <span class="text-sm text-gray-600">Review & Save</span>
            </div>
          </Show>
          
          <Show when={props.initialData}>
            <p class="text-sm text-gray-600 mb-4">Review and edit the resource details</p>
          </Show>

          {/* Resource preview card */}
          <div class="flex gap-4 p-4 bg-gray-50 rounded-xl">
            <Show when={fetchedData()?.thumbnail}>
              <img
                src={fetchedData()!.thumbnail}
                alt=""
                class="w-24 h-32 object-cover rounded-lg shadow-sm"
              />
            </Show>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <Show when={currentPlugin()}>
                  {(() => {
                    const plugin = currentPlugin()!;
                    const Icon = plugin.icon;
                    return (
                      <span 
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          'background-color': `${plugin.color}20`,
                          color: plugin.color,
                        }}
                      >
                        <Icon class="w-3 h-3" />
                        {plugin.name}
                      </span>
                    );
                  })()}
                </Show>
              </div>
              <h4 class="font-semibold text-gray-900 line-clamp-2">{fetchedData()?.title}</h4>
              <p class="text-sm text-gray-600 mt-1 line-clamp-3">{fetchedData()?.description}</p>
            </div>
          </div>

          {/* Editable fields for extension data */}
          <Show when={props.initialData}>
            <div class="space-y-3 pt-2">
              <Input
                label="Title"
                value={fetchedData()?.title || ''}
                onInput={(e) => setFetchedData(prev => prev ? { ...prev, title: e.currentTarget.value } : null)}
              />
              <Textarea
                label="Description"
                value={fetchedData()?.description || ''}
                onInput={(e) => setFetchedData(prev => prev ? { ...prev, description: e.currentTarget.value } : null)}
                rows={3}
              />
              <Input
                label="URL"
                value={fetchedData()?.url || ''}
                onInput={(e) => setFetchedData(prev => prev ? { ...prev, url: e.currentTarget.value } : null)}
              />
              <ThumbnailInput
                label="Thumbnail"
                value={fetchedData()?.thumbnail || ''}
                onChange={(value) => setFetchedData(prev => prev ? { ...prev, thumbnail: value } : null)}
              />
            </div>
          </Show>
          
          <CategoryTopicSelector 
            selected={selectedCategoryTopics()} 
            onChange={setSelectedCategoryTopics} 
          />
          
          <Show when={error()}>
            <p class="text-sm text-red-600">{error()}</p>
          </Show>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={props.onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading()}>
              <Check class="w-4 h-4" /> Save Resource
            </Button>
          </div>
        </div>
      </Show>

      {/* Step: Saving */}
      <Show when={step() === 'saving'}>
        <div class="flex flex-col items-center justify-center py-12">
          <LoaderCircle class="w-10 h-10 animate-spin text-blue-600" />
          <p class="mt-3 text-gray-600">Saving resource...</p>
        </div>
      </Show>

      {/* Step: Manual Entry */}
      <Show when={step() === 'manual-entry'}>
        <div class="space-y-4">
          <div class="space-y-3">
            <Input
              label="Title"
              placeholder="Enter resource title"
              value={manualTitle()}
              onInput={(e) => setManualTitle(e.currentTarget.value)}
              autofocus
              required
            />
            
            <Textarea
              label="Description"
              placeholder="Enter a description (optional)"
              value={manualDescription()}
              onInput={(e) => setManualDescription(e.currentTarget.value)}
              rows={3}
            />
            
            <Input
              label="URL"
              placeholder="https://example.com (optional)"
              value={manualUrl()}
              onInput={(e) => setManualUrl(e.currentTarget.value)}
            />
            
            <ThumbnailInput
              label="Thumbnail"
              value={manualThumbnail()}
              onChange={setManualThumbnail}
            />
            
            <div class="w-full">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Resource Type
              </label>
              <div class="flex flex-wrap gap-2">
                <For each={plugins()}>
                  {(p) => {
                    const Icon = p.icon;
                    const isSelected = () => manualType() === p.id;
                    return (
                      <button
                        type="button"
                        class={`
                          inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                          border-2 transition-all
                          ${isSelected() ? 'ring-2 ring-offset-1' : 'hover:shadow-sm'}
                        `}
                        style={{
                          'background-color': isSelected() ? `${p.color}15` : 'white',
                          'border-color': isSelected() ? p.color : `${p.color}40`,
                          color: p.color,
                          '--tw-ring-color': p.color,
                        }}
                        onClick={() => setManualType(p.id)}
                      >
                        <Icon class="w-4 h-4" />
                        <span>{p.name}</span>
                        <Show when={isSelected()}>
                          <Check class="w-3.5 h-3.5" />
                        </Show>
                      </button>
                    );
                  }}
                </For>
              </div>
            </div>
            
            <CategoryTopicSelector 
              selected={selectedCategoryTopics()} 
              onChange={setSelectedCategoryTopics} 
            />
          </div>

          <Show when={error()}>
            <p class="text-sm text-red-600">{error()}</p>
          </Show>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={props.onClose}>Cancel</Button>
            <Button onClick={handleManualSave} disabled={!manualTitle().trim()}>
              <Check class="w-4 h-4" /> Save Resource
            </Button>
          </div>
        </div>
      </Show>
    </Modal>
  );
};
