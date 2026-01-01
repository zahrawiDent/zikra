import { Suspense, type Component, createSignal, onMount, Show } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { Sidebar, AddResourceModal } from './components';
import { initializePlugins } from './lib/plugins';
import { seedDefaultTopics } from './lib/db/actions';
import { initializeStore } from './lib/db/schema';

// Initialize plugins on app load
initializePlugins();

/**
 * Data passed from browser extension
 * Now simplified - just URL and optional hints
 */
export interface ExtensionResourceData {
  /** The URL to save (required) */
  url: string;
  /** Hints extracted by extension (app may override with better data) */
  hints?: {
    title?: string;
    description?: string;
    thumbnail?: string;
  };
}

const App: Component<{ children: Element }> = (props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [dbReady, setDbReady] = createSignal(false);
  const [extensionData, setExtensionData] = createSignal<ExtensionResourceData | null>(null);

  onMount(async () => {
    // Initialize TinyBase store with IndexedDB persistence
    await initializeStore();
    // Seed default topics on first run (sync operation)
    seedDefaultTopics();
    setDbReady(true);

    // Check for extension data in URL params
    if (searchParams.action === 'add-resource' && searchParams.url) {
      setExtensionData({
        url: searchParams.url as string,
        hints: {
          title: (searchParams.hint_title as string) || undefined,
          description: (searchParams.hint_description as string) || undefined,
          thumbnail: (searchParams.hint_thumbnail as string) || undefined,
        },
      });
      setShowAddModal(true);
      // Clear URL params
      setSearchParams({ 
        action: undefined, 
        url: undefined,
        hint_title: undefined, 
        hint_description: undefined, 
        hint_thumbnail: undefined,
        // Legacy params (for backwards compatibility)
        type: undefined, 
        title: undefined, 
        description: undefined, 
        thumbnail: undefined,
      });
    }
  });

  const handleCloseModal = () => {
    setShowAddModal(false);
    setExtensionData(null);
  };

  return (
    <Show when={dbReady()} fallback={<div class="flex h-screen items-center justify-center">Initializing...</div>}>
      <div class="flex h-screen bg-gray-100">
        <Sidebar onAddResource={() => setShowAddModal(true)} />
        
        <main class="flex-1 overflow-y-auto">
          <Suspense fallback={<div class="p-6">Loading...</div>}>
            {props.children}
          </Suspense>
        </main>

        <AddResourceModal
          open={showAddModal()}
          onClose={handleCloseModal}
          initialData={extensionData()}
        />
      </div>
    </Show>
  );
};

export default App;
