import { type Component, For, Show, createMemo, createSignal } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { useResources, useCategories, useTopics, type ResourceFilters } from '../lib/db/hooks';
import { ResourceCard } from '../components';
import { pluginRegistry } from '../lib/plugins';
import { Input } from '../components/ui';
import { 
  Search, SlidersHorizontal, ChevronRight, LayoutGrid, LayoutList, 
  X, Filter, Sparkles, BookOpen, Video, FileText, Globe,
  Clock, PlayCircle, CheckCircle2
} from 'lucide-solid';

// Quick filter chip component
const FilterChip: Component<{
  active: boolean;
  onClick: () => void;
  children: any;
  icon?: any;
  color?: string;
}> = (props) => {
  const Icon = props.icon;
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
        props.active 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105' 
          : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      {Icon && <Icon class="w-3.5 h-3.5" />}
      {props.children}
    </button>
  );
};

// Resource type icons
const typeIcons: Record<string, any> = {
  youtube: Video,
  book: BookOpen,
  paper: FileText,
  article: Globe,
};

// Status icons and colors
const statusConfig = {
  'to-study': { icon: Clock, color: 'gray', label: 'To Study', bg: 'bg-gray-100', text: 'text-gray-600' },
  'in-progress': { icon: PlayCircle, color: 'blue', label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-600' },
  'completed': { icon: CheckCircle2, color: 'green', label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-600' },
};

export const Resources: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = createSignal<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = createSignal(false);
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

  const activeFilterCount = createMemo(() => {
    let count = 0;
    if (getParam('type')) count++;
    if (getParam('status')) count++;
    if (getParam('category')) count++;
    if (getParam('topic')) count++;
    return count;
  });

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

  // Group resources by type for grid view
  const resourcesByType = createMemo(() => {
    const grouped: Record<string, typeof resources> = {};
    resources()?.forEach(r => {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type]!.push(r);
    });
    return grouped;
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div class="p-4 md:p-6 lg:p-8 space-y-5 md:space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div class="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Show 
                when={breadcrumb().length > 0}
                fallback={
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <BookOpen class="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 class="text-xl md:text-2xl font-bold text-gray-900">All Resources</h1>
                      <p class="text-sm text-gray-500">
                        {resources()?.length || 0} resources
                        {getParam('status') && ` • ${statusConfig[getParam('status') as keyof typeof statusConfig]?.label}`}
                      </p>
                    </div>
                  </div>
                }
              >
                <div class="flex items-center gap-2">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <span class="text-lg">{currentCategory()?.icon}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xl md:text-2xl font-bold text-gray-900 flex-wrap">
                    <For each={breadcrumb()}>
                      {(part, index) => (
                        <>
                          <Show when={index() > 0}>
                            <ChevronRight class="w-5 h-5 text-gray-300" />
                          </Show>
                          <Show 
                            when={part.onClick}
                            fallback={<span>{part.label}</span>}
                          >
                            <button
                              type="button"
                              class="text-gray-400 hover:text-gray-600 transition-colors"
                              onClick={part.onClick}
                            >
                              {part.label}
                            </button>
                          </Show>
                        </>
                      )}
                    </For>
                  </div>
                </div>
                <p class="text-sm text-gray-500 mt-1 ml-13">
                  {resources()?.length || 0} resources
                </p>
              </Show>
            </div>
            
            {/* View Toggle */}
            <div class="flex items-center gap-2">
              <div class="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  class={`p-2 rounded-md transition-all ${
                    viewMode() === 'list' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutList class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  class={`p-2 rounded-md transition-all ${
                    viewMode() === 'grid' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Quick Filters */}
        <div class="space-y-3">
          {/* Search Bar */}
          <div class="relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search resources by title, description..."
              value={getParam('q') || ''}
              onInput={(e) => setSearchParams({ q: e.currentTarget.value || undefined })}
              class="w-full pl-12 pr-4 py-3 md:py-3.5 bg-white border border-gray-200 rounded-xl md:rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
            />
            <Show when={getParam('q')}>
              <button
                type="button"
                onClick={() => setSearchParams({ q: undefined })}
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X class="w-4 h-4" />
              </button>
            </Show>
          </div>

          {/* Filter Chips Row */}
          <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters())}
              class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                showFilters() || activeFilterCount() > 0
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              <Filter class="w-3.5 h-3.5" />
              Filters
              <Show when={activeFilterCount() > 0}>
                <span class="ml-0.5 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {activeFilterCount()}
                </span>
              </Show>
            </button>

            <div class="w-px h-6 bg-gray-200 flex-shrink-0" />

            {/* Type Quick Filters */}
            <For each={plugins}>
              {(plugin) => {
                const Icon = typeIcons[plugin.id] || Globe;
                return (
                  <FilterChip
                    active={getParam('type') === plugin.id}
                    onClick={() => setSearchParams({ type: getParam('type') === plugin.id ? undefined : plugin.id })}
                    icon={Icon}
                  >
                    {plugin.name}
                  </FilterChip>
                );
              }}
            </For>

            <div class="w-px h-6 bg-gray-200 flex-shrink-0" />

            {/* Status Quick Filters */}
            <For each={Object.entries(statusConfig)}>
              {([status, config]) => (
                <FilterChip
                  active={getParam('status') === status}
                  onClick={() => setSearchParams({ status: getParam('status') === status ? undefined : status })}
                  icon={config.icon}
                >
                  {config.label}
                </FilterChip>
              )}
            </For>
          </div>

          {/* Expanded Filter Panel */}
          <Show when={showFilters()}>
            <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-gray-900">Refine Results</h3>
                <Show when={hasFilters()}>
                  <button
                    type="button"
                    onClick={clearFilters}
                    class="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </Show>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Category filter */}
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                  <select
                    class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={getParam('category') || ''}
                    onChange={(e) => {
                      const categoryId = e.currentTarget.value || undefined;
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
                </div>

                {/* Topic filter */}
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1.5">Topic</label>
                  <select
                    class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
                    value={getParam('topic') || ''}
                    onChange={(e) => setSearchParams({ topic: e.currentTarget.value || undefined })}
                    disabled={!getParam('category') || !topics() || topics()!.length === 0}
                  >
                    <option value="">All topics</option>
                    <For each={topics()}>
                      {(topic) => <option value={topic.id}>{topic.name}</option>}
                    </For>
                  </select>
                </div>
                
                {/* Type filter */}
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                  <select
                    class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={getParam('type') || ''}
                    onChange={(e) => setSearchParams({ type: e.currentTarget.value || undefined })}
                  >
                    <option value="">All types</option>
                    <For each={plugins}>
                      {(plugin) => <option value={plugin.id}>{plugin.name}</option>}
                    </For>
                  </select>
                </div>

                {/* Status filter */}
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select
                    class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={getParam('status') || ''}
                    onChange={(e) => setSearchParams({ status: e.currentTarget.value || undefined })}
                  >
                    <option value="">All statuses</option>
                    <option value="to-study">To Study</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </Show>

          {/* Active Filters Display */}
          <Show when={hasFilters()}>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs text-gray-500 font-medium">Active:</span>
              <Show when={getParam('category')}>
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                  {currentCategory()?.icon} {currentCategory()?.name}
                  <button 
                    type="button" 
                    onClick={() => setSearchParams({ category: undefined, topic: undefined })}
                    class="ml-0.5 hover:text-violet-900"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </span>
              </Show>
              <Show when={getParam('topic')}>
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {currentTopic()?.name}
                  <button 
                    type="button" 
                    onClick={() => setSearchParams({ topic: undefined })}
                    class="ml-0.5 hover:text-purple-900"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </span>
              </Show>
              <Show when={getParam('type')}>
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {plugins.find(p => p.id === getParam('type'))?.name}
                  <button 
                    type="button" 
                    onClick={() => setSearchParams({ type: undefined })}
                    class="ml-0.5 hover:text-blue-900"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </span>
              </Show>
              <Show when={getParam('status')}>
                <span class={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[getParam('status') as keyof typeof statusConfig]?.bg} ${statusConfig[getParam('status') as keyof typeof statusConfig]?.text}`}>
                  {statusConfig[getParam('status') as keyof typeof statusConfig]?.label}
                  <button 
                    type="button" 
                    onClick={() => setSearchParams({ status: undefined })}
                    class="ml-0.5 hover:opacity-70"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </span>
              </Show>
              <button
                type="button"
                onClick={clearFilters}
                class="text-xs text-gray-500 hover:text-gray-700 font-medium ml-2"
              >
                Clear all
              </button>
            </div>
          </Show>
        </div>

        {/* Resources Display */}
        <Show
          when={resources() && resources()!.length > 0}
          fallback={
            <div class="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-8 md:p-16 text-center shadow-sm">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <SlidersHorizontal class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-gray-900 font-medium mb-1">No resources found</p>
              <p class="text-sm text-gray-500 mb-4">Try adjusting your filters or search terms</p>
              <Show when={hasFilters()}>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30"
                  onClick={clearFilters}
                >
                  <X class="w-4 h-4" />
                  Clear all filters
                </button>
              </Show>
            </div>
          }
        >
          <Show
            when={viewMode() === 'list'}
            fallback={
              /* Grid View */
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <For each={resources()}>
                  {(resource) => (
                    <ResourceCard resource={resource} categories={categories() || []} compact />
                  )}
                </For>
              </div>
            }
          >
            {/* List View */}
            <div class="space-y-3">
              <For each={resources()}>
                {(resource) => (
                  <ResourceCard resource={resource} categories={categories() || []} />
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default Resources;
