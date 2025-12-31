import { Suspense, type Component, createSignal, onMount, Show } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { Sidebar, AddResourceModal } from './components';
import { initializePlugins } from './lib/plugins';
import { seedDefaultTopics } from './lib/db/actions';
import { initializeStore } from './lib/db/schema';

// Initialize plugins on app load
initializePlugins();

export interface ExtensionResourceData {
  type: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
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
    if (searchParams.action === 'add-resource') {
      setExtensionData({
        type: (searchParams.type as string) || 'article',
        title: (searchParams.title as string) || '',
        description: (searchParams.description as string) || '',
        url: (searchParams.url as string) || '',
        thumbnail: (searchParams.thumbnail as string) || '',
      });
      setShowAddModal(true);
      // Clear URL params
      setSearchParams({ 
        action: undefined, 
        type: undefined, 
        title: undefined, 
        description: undefined, 
        url: undefined, 
        thumbnail: undefined 
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
