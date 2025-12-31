import { type Component, For, Show } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useTopics, useStats } from '../lib/db/hooks';
import { 
  Home, BookOpen, Tag, Settings, Plus, 
  Clock, CheckCircle, Loader 
} from 'lucide-solid';

interface SidebarProps {
  onAddResource: () => void;
}

export const Sidebar: Component<SidebarProps> = (props) => {
  const location = useLocation();
  const { data: topics } = useTopics();
  const { data: stats } = useStats();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/resources', icon: BookOpen, label: 'All Resources' },
    { path: '/topics', icon: Tag, label: 'Topics' },
  ];

  return (
    <aside class="w-64 bg-gray-50 border-r h-screen flex flex-col">
      {/* Logo */}
      <div class="p-4 border-b">
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

        {/* Topics */}
        <Show when={topics() && topics()!.length > 0}>
          <div class="pt-4 mt-4 border-t">
            <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Topics
            </p>
            <For each={topics()?.slice(0, 8)}>
              {(topic) => (
                <A
                  href={`/resources?topic=${topic.id}`}
                  class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
                >
                  <span
                    class="w-2 h-2 rounded-full"
                    style={{ 'background-color': topic.color }}
                  />
                  {topic.name}
                </A>
              )}
            </For>
            <Show when={topics()!.length > 8}>
              <A
                href="/topics"
                class="block px-3 py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                View all topics →
              </A>
            </Show>
          </div>
        </Show>
      </nav>

      {/* Settings */}
      <div class="p-3 border-t">
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
