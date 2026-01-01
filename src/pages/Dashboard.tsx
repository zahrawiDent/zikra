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
    <div class="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">Track your dentistry study progress</p>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-4 gap-4">
        <For each={statCards()}>
          {(stat) => (
            <div class="bg-white border rounded-xl p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">{stat.label}</p>
                  <p class="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div class={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon class={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Progress Overview */}
      <Show when={stats() && stats()!.resources > 0}>
        <div class="bg-white border rounded-xl p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Study Progress</h2>
          <div class="flex items-center gap-4">
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
            <div class="flex items-center gap-4 text-sm">
              <span class="flex items-center gap-1">
                <span class="w-3 h-3 rounded-full bg-green-500" />
                Completed
              </span>
              <span class="flex items-center gap-1">
                <span class="w-3 h-3 rounded-full bg-blue-500" />
                In Progress
              </span>
              <span class="flex items-center gap-1">
                <span class="w-3 h-3 rounded-full bg-gray-200" />
                To Study
              </span>
            </div>
          </div>
        </div>
      </Show>

      {/* Recent Resources */}
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Recent Resources</h2>
          <A href="/resources" class="text-sm text-blue-600 hover:text-blue-700">
            View all →
          </A>
        </div>
        
        <Show
          when={recentResources() && recentResources()!.length > 0}
          fallback={
            <div class="bg-white border rounded-xl p-8 text-center">
              <BookOpen class="w-12 h-12 text-gray-300 mx-auto" />
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
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-xl p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Getting Started</h2>
          <p class="text-gray-600 mb-4">
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
