import { type Component, For, Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useCategories, useTopicsByCategory, useStats, useCategoryTopicCounts } from '../lib/db/hooks';
import { 
  Home, BookOpen, FolderOpen, Settings, Plus, 
  Clock, CheckCircle, Loader, ChevronDown, ChevronRight 
} from 'lucide-solid';
import { InstallButton } from './InstallButton';

interface SidebarProps {
  onAddResource: () => void;
  mobile?: boolean;
}

export const Sidebar: Component<SidebarProps> = (props) => {
  const location = useLocation();
  const { data: categories } = useCategories();
  const topicsByCategory = useTopicsByCategory();
  const counts = useCategoryTopicCounts();
  const { data: stats } = useStats();
  
  // Track expanded categories in sidebar
  const [expandedCategories, setExpandedCategories] = createSignal<Set<string>>(new Set());

  const toggleExpand = (categoryId: string, e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const isExpanded = (categoryId: string) => expandedCategories().has(categoryId);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/resources', icon: BookOpen, label: 'All Resources' },
    { path: '/categories', icon: FolderOpen, label: 'Categories' },
  ];

  return (
    <aside class={`${props.mobile ? 'w-full h-full' : 'w-64'} bg-gray-50 border-r h-screen flex flex-col`}>
      {/* Logo */}
      <div class={`p-4 border-b ${props.mobile ? 'pt-6' : ''}`}>
        <h1 class="text-xl font-bold text-gray-900">🦷 DentStudy</h1>
        <p class="text-xs text-gray-500 mt-0.5">Your dentistry study hub</p>
      </div>

      {/* Add Resource Button */}
      <div class="p-4">
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          onClick={props.onAddResource}
        >
          <Plus class="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {/* Navigation */}
      <nav class="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <For each={navItems}>
          {(item) => (
            <A
              href={item.path}
              class={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <item.icon class="w-4 h-4" />
              {item.label}
            </A>
          )}
        </For>

        {/* Status filters */}
        <div class="pt-4 mt-4 border-t">
          <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            By Status
          </p>
          <A
            href="/resources?status=to-study"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
          >
            <span class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-gray-400" />
              To Study
            </span>
            <span class="text-xs text-gray-500">{stats()?.byStatus['to-study'] || 0}</span>
          </A>
          <A
            href="/resources?status=in-progress"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
          >
            <span class="flex items-center gap-2">
              <Loader class="w-4 h-4 text-blue-500" />
              In Progress
            </span>
            <span class="text-xs text-gray-500">{stats()?.byStatus['in-progress'] || 0}</span>
          </A>
          <A
            href="/resources?status=completed"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
          >
            <span class="flex items-center gap-2">
              <CheckCircle class="w-4 h-4 text-green-500" />
              Completed
            </span>
            <span class="text-xs text-gray-500">{stats()?.byStatus['completed'] || 0}</span>
          </A>
        </div>

        {/* Categories with nested topics */}
        <Show when={categories() && categories()!.length > 0}>
          <div class="pt-4 mt-4 border-t">
            <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Categories
            </p>
            <For each={categories()?.slice(0, 10)}>
              {(category) => {
                const topics = () => topicsByCategory().get(category.id) || [];
                const resourceCount = () => counts().byCategory.get(category.id) || 0;
                const expanded = () => isExpanded(category.id);
                
                return (
                  <div>
                    {/* Category row */}
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        class="p-1 hover:bg-gray-200 rounded"
                        onClick={(e) => toggleExpand(category.id, e)}
                      >
                        {topics().length > 0 ? (
                          expanded() ? (
                            <ChevronDown class="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronRight class="w-3 h-3 text-gray-400" />
                          )
                        ) : (
                          <span class="w-3 h-3" />
                        )}
                      </button>
                      <A
                        href={`/resources?category=${category.id}`}
                        class="flex-1 flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
                      >
                        <span class="flex items-center gap-2">
                          <span class="text-sm">{category.icon}</span>
                          <span class="truncate">{category.name}</span>
                        </span>
                        <span class="text-xs text-gray-500">{resourceCount()}</span>
                      </A>
                    </div>
                    
                    {/* Nested topics */}
                    <Show when={expanded() && topics().length > 0}>
                      <div class="ml-5 border-l border-gray-200 pl-2 mt-1 space-y-0.5">
                        <For each={topics().slice(0, 6)}>
                          {(topic) => {
                            const topicCount = () => counts().byTopic.get(topic.id) || 0;
                            return (
                              <A
                                href={`/resources?category=${category.id}&topic=${topic.id}`}
                                class="flex items-center justify-between px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                              >
                                <span class="flex items-center gap-1.5">
                                  <span
                                    class="w-1.5 h-1.5 rounded-full"
                                    style={{ 'background-color': topic.color }}
                                  />
                                  <span class="truncate">{topic.name}</span>
                                </span>
                                <span class="text-gray-400">{topicCount()}</span>
                              </A>
                            );
                          }}
                        </For>
                        <Show when={topics().length > 6}>
                          <A
                            href={`/resources?category=${category.id}`}
                            class="block px-2 py-1 text-xs text-blue-600 hover:text-blue-700"
                          >
                            +{topics().length - 6} more
                          </A>
                        </Show>
                      </div>
                    </Show>
                  </div>
                );
              }}
            </For>
            <Show when={categories()!.length > 10}>
              <A
                href="/categories"
                class="block px-3 py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                View all categories →
              </A>
            </Show>
          </div>
        </Show>
      </nav>

      {/* Settings & Install */}
      <div class="p-3 border-t space-y-1">
        <InstallButton />
        <A
          href="/settings"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
        >
          <Settings class="w-4 h-4" />
          Settings
        </A>
      </div>
    </aside>
  );
};
