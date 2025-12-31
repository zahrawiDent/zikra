import { type Component, createSignal, Show } from 'solid-js';
import { downloadAndSaveThumbnail, saveFileAsThumbnail } from '../../lib/db/thumbnails';
import { useThumbnail } from '../../lib/db/hooks';
import { Upload, Link, LoaderCircle, X } from 'lucide-solid';

interface ThumbnailInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ThumbnailInput: Component<ThumbnailInputProps> = (props) => {
  const [urlInput, setUrlInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [mode, setMode] = createSignal<'url' | 'upload'>('url');
  
  const resolvedUrl = useThumbnail(() => props.value);
  let fileInputRef: HTMLInputElement | undefined;

  const handleUrlDownload = async () => {
    const url = urlInput().trim();
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const localUrl = await downloadAndSaveThumbnail(url);
      props.onChange(localUrl);
      setUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download image');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const localUrl = await saveFileAsThumbnail(file);
      props.onChange(localUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save image');
    } finally {
      setLoading(false);
      input.value = '';
    }
  };

  const handleClear = () => {
    props.onChange('');
  };

  return (
    <div class="space-y-2">
      <Show when={props.label}>
        <label class="block text-sm font-medium text-gray-700">{props.label}</label>
      </Show>

      {/* Current thumbnail preview */}
      <Show when={resolvedUrl()}>
        <div class="relative inline-block">
          <img
            src={resolvedUrl()}
            alt="Thumbnail preview"
            class="w-32 h-auto object-contain rounded-lg border"
          />
          <button
            type="button"
            class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            onClick={handleClear}
            title="Remove thumbnail"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </Show>

      {/* Mode toggle */}
      <div class="flex gap-2">
        <button
          type="button"
          class={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border ${
            mode() === 'url' 
              ? 'bg-blue-50 border-blue-300 text-blue-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setMode('url')}
        >
          <Link class="w-4 h-4" />
          From URL
        </button>
        <button
          type="button"
          class={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border ${
            mode() === 'upload' 
              ? 'bg-blue-50 border-blue-300 text-blue-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setMode('upload')}
        >
          <Upload class="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* URL input */}
      <Show when={mode() === 'url'}>
        <div class="flex gap-2">
          <input
            type="url"
            value={urlInput()}
            onInput={(e) => setUrlInput(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlDownload()}
            placeholder="https://example.com/image.jpg"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading()}
          />
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleUrlDownload}
            disabled={loading() || !urlInput().trim()}
          >
            {loading() ? <LoaderCircle class="w-4 h-4 animate-spin" /> : 'Download'}
          </button>
        </div>
      </Show>

      {/* File upload */}
      <Show when={mode() === 'upload'}>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            class="hidden"
          />
          <button
            type="button"
            class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            onClick={() => fileInputRef?.click()}
            disabled={loading()}
          >
            {loading() ? (
              <LoaderCircle class="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Upload class="w-4 h-4" />
                Click to upload an image
              </>
            )}
          </button>
        </div>
      </Show>

      {/* Error message */}
      <Show when={error()}>
        <p class="text-sm text-red-600">{error()}</p>
      </Show>
    </div>
  );
};
