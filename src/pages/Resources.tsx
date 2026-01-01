import { type Component, For, Show, createMemo } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { useResources, useCategories, useTopics, type ResourceFilters } from '../lib/db/hooks';
import { ResourceCard } from '../components';
import { pluginRegistry } from '../lib/plugins';
import { Input } from '../components/ui';
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-solid';

export const Resources: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const plugins = pluginRegistry.getAll();
  const { data: categories } = useCategories();
  
  // Helper to get single string value from search params (can be string or string[])
  const getParam = (key: string): string | undefined => {
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0];
    return val || undefined;
  };

  // Get topics filtered by selected category
  const { data: topics } = useTopics(() => getParam('category'));

  // Create a reactive accessor for filters that properly tracks searchParams
  const filters = (): ResourceFilters => ({
    type: getParam('type'),
    status: getParam('status'),
    categoryId: getParam('category'),
    topicId: getParam('topic'),
    search: getParam('q'),
  });

  const { data: resources } = useResources(filters);

  const currentCategory = createMemo(() => {
    const categoryId = getParam('category');
    if (!categoryId || !categories()) return null;
    return categories()!.find(c => c.id === categoryId);
  });

  const currentTopic = createMemo(() => {
    const topicId = getParam('topic');
    if (!topicId || !topics()) return null;
    return topics()!.find(t => t.id === topicId);
  });

  const clearFilters = () => {
    setSearchParams({ type: undefined, status: undefined, category: undefined, topic: undefined, q: undefined });
  };

  const hasFilters = () => getParam('type') || getParam('status') || getParam('category') || getParam('topic') || getParam('q');

  // Build breadcrumb path
  const breadcrumb = createMemo(() => {
    const parts: Array<{ label: string; onClick?: () => void }> = [];
    
    const category = currentCategory();
    const topic = currentTopic();
    
    if (category) {
      parts.push({
        label: category.name,
        onClick: topic ? () => setSearchParams({ topic: undefined }) : undefined
      });
    }
    
    if (topic) {
      parts.push({ label: topic.name });
    }
    
    return parts;
  });

  return (
    <div class="p-6 space-y-6">
      {/* Header */}
      <div>
        <Show 
          when={breadcrumb().length > 0}
          fallback={<h1 class="text-2xl font-bold text-gray-900">All Resources</h1>}
        >
          <div class="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <For each={breadcrumb()}>
              {(part, index) => (
                <>
                  <Show when={index() > 0}>
                    <ChevronRight class="w-5 h-5 text-gray-400" />
                  </Show>
                  <Show 
                    when={part.onClick}
                    fallback={<span>{part.label}</span>}
                  >
                    <button
                      type="button"
                      class="text-gray-500 hover:text-gray-700"
                      onClick={part.onClick}
                    >
                      {part.label}
                    </button>
                  </Show>
                </>
              )}
            </For>
          </div>
        </Show>
        <p class="text-gray-600 mt-1">
          {resources()?.length || 0} resources
          {getParam('status') ? ` • ${getParam('status')!.replace('-', ' ')}` : ''}
        </p>
      </div>

      {/* Search & Filters */}
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search resources..."
            value={getParam('q') || ''}
            onInput={(e) => setSearchParams({ q: e.currentTarget.value || undefined })}
            class="pl-10"
          />
        </div>
        
        {/* Category filter */}
        <select
          class="px-3 py-2 border rounded-lg text-sm bg-white"
          value={getParam('category') || ''}
          onChange={(e) => {
            const categoryId = e.currentTarget.value || undefined;
            // Clear topic when category changes
            setSearchParams({ category: categoryId, topic: undefined });
          }}
        >
          <option value="">All categories</option>
          <For each={categories()}>
            {(category) => (
              <option value={category.id}>
                {category.icon} {category.name}
              </option>
            )}
          </For>
        </select>

        {/* Topic filter (only show if category selected) */}
        <Show when={getParam('category') && topics() && topics()!.length > 0}>
          <select
            class="px-3 py-2 border rounded-lg text-sm bg-white"
            value={getParam('topic') || ''}
            onChange={(e) => setSearchParams({ topic: e.currentTarget.value || undefined })}
          >
            <option value="">All topics</option>
            <For each={topics()}>
              {(topic) => <option value={topic.id}>{topic.name}</option>}
            </For>
          </select>
        </Show>
        
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
              <ResourceCard resource={resource} categories={categories() || []} />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Resources;
