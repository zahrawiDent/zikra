import { type Component, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { useResources, useStats, useCategories } from '../lib/db/hooks';
import { ResourceCard } from '../components';
import { BookOpen, FileText, FolderOpen, TrendingUp } from 'lucide-solid';

export const Dashboard: Component = () => {
  const { data: stats } = useStats();
  const { data: recentResources } = useResources();
  const { data: categories } = useCategories();

  const statCards = () => [
    { label: 'Total Resources', value: stats()?.resources || 0, icon: BookOpen, color: 'blue' },
    { label: 'Notes', value: stats()?.notes || 0, icon: FileText, color: 'purple' },
    { label: 'Categories', value: stats()?.categories || 0, icon: FolderOpen, color: 'green' },
    { label: 'Completed', value: stats()?.byStatus.completed || 0, icon: TrendingUp, color: 'emerald' },
  ];

  return (
    <div class="p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1 text-sm md:text-base">Track your dentistry study progress</p>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <For each={statCards()}>
          {(stat) => (
            <div class="bg-white border rounded-xl p-3 md:p-4">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <p class="text-xs md:text-sm text-gray-500 truncate">{stat.label}</p>
                  <p class="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div class={`p-2 md:p-3 rounded-lg bg-${stat.color}-100 flex-shrink-0`}>
                  <stat.icon class={`w-4 h-4 md:w-5 md:h-5 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Progress Overview */}
      <Show when={stats() && stats()!.resources > 0}>
        <div class="bg-white border rounded-xl p-4 md:p-6">
          <h2 class="text-base md:text-lg font-semibold text-gray-900 mb-4">Study Progress</h2>
          <div class="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div class="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full flex">
                <div
                  class="bg-green-500 transition-all"
                  style={{ width: `${(stats()!.byStatus.completed / stats()!.resources) * 100}%` }}
                />
                <div
                  class="bg-blue-500 transition-all"
                  style={{ width: `${(stats()!.byStatus['in-progress'] / stats()!.resources) * 100}%` }}
                />
              </div>
            </div>
            <div class="flex items-center gap-3 md:gap-4 text-xs md:text-sm flex-wrap">
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
                Completed
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500" />
                In Progress
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-200" />
                To Study
              </span>
            </div>
          </div>
        </div>
      </Show>

      {/* Recent Resources */}
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base md:text-lg font-semibold text-gray-900">Recent Resources</h2>
          <A href="/resources" class="text-sm text-blue-600 hover:text-blue-700">
            View all →
          </A>
        </div>
        
        <Show
          when={recentResources() && recentResources()!.length > 0}
          fallback={
            <div class="bg-white border rounded-xl p-6 md:p-8 text-center">
              <BookOpen class="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto" />
              <p class="text-gray-500 mt-2">No resources yet</p>
              <p class="text-sm text-gray-400">Add your first resource to get started</p>
            </div>
          }
        >
          <div class="space-y-3">
            <For each={recentResources()?.slice(0, 5)}>
              {(resource) => (
                <ResourceCard resource={resource} categories={categories() || []} />
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Quick Actions */}
      <Show when={!recentResources() || recentResources()!.length === 0}>
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-xl p-4 md:p-6">
          <h2 class="text-base md:text-lg font-semibold text-gray-900 mb-2">Getting Started</h2>
          <p class="text-gray-600 mb-4 text-sm md:text-base">
            Welcome to DentStudy! Start building your study library by adding resources.
          </p>
          <ul class="space-y-2 text-sm text-gray-600">
            <li>📺 Add YouTube videos from dental lectures</li>
            <li>📚 Search and save textbooks from Google Books</li>
            <li>📄 Find research papers on dental topics</li>
            <li>🏷️ Organize everything with topics</li>
          </ul>
        </div>
      </Show>
    </div>
  );
};

export default Dashboard;
