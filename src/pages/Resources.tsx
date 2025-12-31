import { type Component, For, Show, createMemo } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { useResources, useTopics, type ResourceFilters } from '../lib/db/hooks';
import { ResourceCard } from '../components';
import { pluginRegistry } from '../lib/plugins';
import { Input } from '../components/ui';
import { Search, SlidersHorizontal } from 'lucide-solid';

export const Resources: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const plugins = pluginRegistry.getAll();
  
  // Helper to get single string value from search params (can be string or string[])
  const getParam = (key: string): string | undefined => {
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0];
    return val || undefined;
  };

  // Create a reactive accessor for filters that properly tracks searchParams
  const filters = (): ResourceFilters => ({
    type: getParam('type'),
    status: getParam('status'),
    topicId: getParam('topic'),
    search: getParam('q'),
  });

  const { data: resources } = useResources(filters);
  const { data: topics } = useTopics();

  const currentTopic = createMemo(() => {
    const topicId = getParam('topic');
    if (!topicId || !topics()) return null;
    return topics()!.find(t => t.id === topicId);
  });

  const clearFilters = () => {
    setSearchParams({ type: undefined, status: undefined, topic: undefined, q: undefined });
  };

  const hasFilters = () => getParam('type') || getParam('status') || getParam('topic') || getParam('q');

  return (
    <div class="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {currentTopic() ? currentTopic()!.name : 'All Resources'}
        </h1>
        <p class="text-gray-600 mt-1">
          {resources()?.length || 0} resources
          {getParam('status') ? ` • ${getParam('status')!.replace('-', ' ')}` : ''}
        </p>
      </div>

      {/* Search & Filters */}
      <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search resources..."
            value={getParam('q') || ''}
            onInput={(e) => setSearchParams({ q: e.currentTarget.value || undefined })}
            class="pl-10"
          />
        </div>
        
        {/* Type filter */}
        <select
          class="px-3 py-2 border rounded-lg text-sm bg-white"
          value={getParam('type') || ''}
          onChange={(e) => setSearchParams({ type: e.currentTarget.value || undefined })}
        >
          <option value="">All types</option>
          <For each={plugins}>
            {(plugin) => <option value={plugin.id}>{plugin.name}</option>}
          </For>
        </select>

        {/* Status filter */}
        <select
          class="px-3 py-2 border rounded-lg text-sm bg-white"
          value={getParam('status') || ''}
          onChange={(e) => setSearchParams({ status: e.currentTarget.value || undefined })}
        >
          <option value="">All statuses</option>
          <option value="to-study">To Study</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <Show when={hasFilters()}>
          <button
            type="button"
            class="text-sm text-gray-500 hover:text-gray-700"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </Show>
      </div>

      {/* Resources List */}
      <Show
        when={resources() && resources()!.length > 0}
        fallback={
          <div class="text-center py-12 bg-white border rounded-xl">
            <SlidersHorizontal class="w-12 h-12 text-gray-300 mx-auto" />
            <p class="text-gray-500 mt-2">No resources found</p>
            <Show when={hasFilters()}>
              <button
                type="button"
                class="text-sm text-blue-600 hover:text-blue-700 mt-2"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </Show>
          </div>
        }
      >
        <div class="space-y-3">
          <For each={resources()}>
            {(resource) => (
              <ResourceCard resource={resource} topics={topics() || []} />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Resources;
