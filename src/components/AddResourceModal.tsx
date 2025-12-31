import { type Component, createSignal, For, Show, createEffect } from 'solid-js';
import { Modal, Button, Input, Textarea, ThumbnailInput } from './ui';
import { TopicSelector } from './TopicSelector';
import { pluginRegistry, type SearchResult, type FetchedResourceData } from '../lib/plugins';
import { createResource } from '../lib/db/actions';
import { downloadAndSaveThumbnail, isLocalThumbnail } from '../lib/db/thumbnails';
import { Search, LoaderCircle, Check, PenLine } from 'lucide-solid';
import type { ExtensionResourceData } from '../app';

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: ExtensionResourceData | null;
}

type Step = 'select-type' | 'input' | 'search-results' | 'preview' | 'saving' | 'manual-entry';

export const AddResourceModal: Component<AddResourceModalProps> = (props) => {
  const [step, setStep] = createSignal<Step>('select-type');
  const [selectedPlugin, setSelectedPlugin] = createSignal<string | null>(null);
  const [inputValue, setInputValue] = createSignal('');
  const [searchResults, setSearchResults] = createSignal<SearchResult[]>([]);
  const [fetchedData, setFetchedData] = createSignal<FetchedResourceData | null>(null);
  const [selectedTopics, setSelectedTopics] = createSignal<string[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  
  // Manual entry state
  const [manualTitle, setManualTitle] = createSignal('');
  const [manualDescription, setManualDescription] = createSignal('');
  const [manualUrl, setManualUrl] = createSignal('');
  const [manualThumbnail, setManualThumbnail] = createSignal('');
  const [manualType, setManualType] = createSignal<string>('article');

  const plugins = () => pluginRegistry.getAll();
  const plugin = () => selectedPlugin() ? pluginRegistry.get(selectedPlugin()!) : null;

  // Reset state when modal closes
  createEffect(() => {
    if (!props.open) {
      setStep('select-type');
      setSelectedPlugin(null);
      setInputValue('');
      setSearchResults([]);
      setFetchedData(null);
      setSelectedTopics([]);
      setError(null);
      // Reset manual entry fields
      setManualTitle('');
      setManualDescription('');
      setManualUrl('');
      setManualThumbnail('');
      setManualType('article');
    } else if (props.initialData) {
      // Pre-fill from extension data
      setSelectedPlugin(props.initialData.type);
      setFetchedData({
        title: props.initialData.title,
        description: props.initialData.description,
        url: props.initialData.url,
        thumbnail: props.initialData.thumbnail,
        metadata: {},
      });
      setStep('preview');
    }
  });

  const handlePluginSelect = (pluginId: string) => {
    setSelectedPlugin(pluginId);
    setStep('input');
  };

  const handleManualEntry = () => {
    setStep('manual-entry');
  };

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
        topicIds: selectedTopics(),
        status: 'to-study',
      });
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStep('manual-entry');
    }
  };

  const handleInputSubmit = async () => {
    const p = plugin();
    if (!p || !p.validate(inputValue())) {
      setError('Invalid input');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (p.inputType === 'url' && p.fetchFromUrl) {
        const data = await p.fetchFromUrl(inputValue());
        setFetchedData(data);
        setStep('preview');
      } else if (p.inputType === 'search' && p.search) {
        const results = await p.search(inputValue());
        setSearchResults(results);
        setStep('search-results');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResultSelect = async (result: SearchResult) => {
    const p = plugin();
    if (!p?.getDetails) return;

    setLoading(true);
    try {
      const data = await p.getDetails(result);
      setFetchedData(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const data = fetchedData();
    const p = plugin();
    if (!data || !p) return;

    setStep('saving');
    try {
      // Download thumbnail locally if it's a remote URL
      let thumbnailUrl = data.thumbnail || '';
      if (thumbnailUrl && !isLocalThumbnail(thumbnailUrl)) {
        try {
          thumbnailUrl = await downloadAndSaveThumbnail(thumbnailUrl);
        } catch (err) {
          console.warn('Failed to download thumbnail, using original URL:', err);
          // Keep original URL if download fails
        }
      }

      createResource({
        type: p.id,
        title: data.title,
        description: data.description,
        url: data.url,
        thumbnail: thumbnailUrl,
        metadata: data.metadata,
        topicIds: selectedTopics(),
        status: 'to-study',
      });
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStep('preview');
    }
  };

  return (
    <Modal open={props.open} onClose={props.onClose} title="Add Resource" size="lg">
      {/* Step 1: Select Type */}
      <Show when={step() === 'select-type'}>
        <div class="space-y-3">
          <p class="text-sm text-gray-600">What type of resource do you want to add?</p>
          <div class="grid grid-cols-2 gap-3">
            <For each={plugins()}>
              {(p) => (
                <button
                  type="button"
                  class="flex items-center gap-3 p-4 border rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => handlePluginSelect(p.id)}
                >
                  <div class="p-2 rounded-lg" style={{ 'background-color': `${p.color}20` }}>
                    <div style={{ color: p.color }}>
                      {(() => {
                        const Icon = p.icon;
                        return <Icon class="w-5 h-5" />;
                      })()}
                    </div>
                  </div>
                  <span class="font-medium text-gray-900">{p.name}</span>
                </button>
              )}
            </For>
          </div>
          
          <div class="pt-3 border-t">
            <button
              type="button"
              class="w-full flex items-center gap-3 p-4 border border-dashed rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
              onClick={handleManualEntry}
            >
              <div class="p-2 rounded-lg bg-gray-100">
                <PenLine class="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <span class="font-medium text-gray-900">Manual Entry</span>
                <p class="text-sm text-gray-500">Enter all details yourself</p>
              </div>
            </button>
          </div>
        </div>
      </Show>

      {/* Step 2: Input */}
      <Show when={step() === 'input'}>
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <button
              type="button"
              class="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setStep('select-type')}
            >
              ← Back
            </button>
            <span class="text-sm font-medium text-gray-900">{plugin()?.name}</span>
          </div>
          
          <div class="flex gap-2">
            <Input
              placeholder={plugin()?.placeholder}
              value={inputValue()}
              onInput={(e) => setInputValue(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
              class="flex-1"
            />
            <Button onClick={handleInputSubmit} disabled={loading()}>
              {loading() ? <LoaderCircle class="w-4 h-4 animate-spin" /> : <Search class="w-4 h-4" />}
            </Button>
          </div>
          
          <Show when={error()}>
            <p class="text-sm text-red-600">{error()}</p>
          </Show>
        </div>
      </Show>

      {/* Step 3: Search Results */}
      <Show when={step() === 'search-results'}>
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <button
              type="button"
              class="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setStep('input')}
            >
              ← Back
            </button>
            <span class="text-sm text-gray-600">Select a result</span>
          </div>
          
          <Show when={searchResults().length === 0}>
            <p class="text-sm text-gray-500 text-center py-8">No results found</p>
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
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Step 4: Preview */}
      <Show when={step() === 'preview'}>
        <div class="space-y-4">
          <Show when={!props.initialData}>
            <div class="flex items-center gap-2 mb-4">
              <button
                type="button"
                class="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => plugin()?.inputType === 'search' ? setStep('search-results') : setStep('input')}
              >
                ← Back
              </button>
              <span class="text-sm text-gray-600">Review & Save</span>
            </div>
          </Show>
          
          <Show when={props.initialData}>
            <p class="text-sm text-gray-600 mb-4">Review and edit the resource details</p>
          </Show>
          
          <Show when={!props.initialData}>
            <div class="flex gap-4">
              <Show when={fetchedData()?.thumbnail}>
                <img
                  src={fetchedData()!.thumbnail}
                  alt=""
                  class="w-24 h-32 object-cover rounded-lg"
                />
              </Show>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900">{fetchedData()?.title}</h4>
                <p class="text-sm text-gray-600 mt-1 line-clamp-3">{fetchedData()?.description}</p>
              </div>
            </div>
          </Show>

          <Show when={props.initialData}>
            <div class="space-y-3">
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
          
          <TopicSelector selected={selectedTopics()} onChange={setSelectedTopics} />
          
          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={props.onClose}>Cancel</Button>
            <Button onClick={handleSave}>
              <Check class="w-4 h-4" /> Save Resource
            </Button>
          </div>
        </div>
      </Show>

      {/* Step 5: Saving */}
      <Show when={step() === 'saving'}>
        <div class="flex flex-col items-center justify-center py-8">
          <LoaderCircle class="w-8 h-8 animate-spin text-blue-600" />
          <p class="mt-2 text-sm text-gray-600">Saving resource...</p>
        </div>
      </Show>

      {/* Manual Entry Step */}
      <Show when={step() === 'manual-entry'}>
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <button
              type="button"
              class="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setStep('select-type')}
            >
              ← Back
            </button>
            <span class="text-sm font-medium text-gray-900">Manual Entry</span>
          </div>

          <div class="space-y-3">
            <Input
              label="Title"
              placeholder="Enter resource title"
              value={manualTitle()}
              onInput={(e) => setManualTitle(e.currentTarget.value)}
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
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Resource Type
              </label>
              <select
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={manualType()}
                onChange={(e) => setManualType(e.currentTarget.value)}
              >
                <For each={plugins()}>
                  {(p) => (
                    <option value={p.id}>{p.name}</option>
                  )}
                </For>
              </select>
            </div>
            
            <TopicSelector selected={selectedTopics()} onChange={setSelectedTopics} />
          </div>

          <Show when={error()}>
            <p class="text-sm text-red-600">{error()}</p>
          </Show>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={props.onClose}>Cancel</Button>
            <Button onClick={handleManualSave}>
              <Check class="w-4 h-4" /> Save Resource
            </Button>
          </div>
        </div>
      </Show>
    </Modal>
  );
};
