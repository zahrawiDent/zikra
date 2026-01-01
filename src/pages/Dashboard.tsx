import { type Component, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { useResources, useStats, useCategories } from '../lib/db/hooks';
import { ResourceCard } from '../components';
import { 
  BookOpen, FileText, FolderOpen, TrendingUp, 
  Sparkles, Target, Clock, CheckCircle2, PlayCircle,
  ArrowRight, Zap, GraduationCap
} from 'lucide-solid';

export const Dashboard: Component = () => {
  const { data: stats } = useStats();
  const { data: recentResources } = useResources();
  const { data: categories } = useCategories();

  // Calculate progress percentage
  const progressPercent = createMemo(() => {
    const total = stats()?.resources || 0;
    if (total === 0) return 0;
    return Math.round((stats()!.byStatus.completed / total) * 100);
  });

  // Get greeting based on time
  const greeting = createMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  const statCards = () => [
    { 
      label: 'Total Resources', 
      value: stats()?.resources || 0, 
      icon: BookOpen, 
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
      trend: null
    },
    { 
      label: 'In Progress', 
      value: stats()?.byStatus['in-progress'] || 0, 
      icon: PlayCircle, 
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-100',
      iconBg: 'bg-amber-500',
      trend: null
    },
    { 
      label: 'Completed', 
      value: stats()?.byStatus.completed || 0, 
      icon: CheckCircle2, 
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-100',
      iconBg: 'bg-emerald-500',
      trend: `${progressPercent()}%`
    },
    { 
      label: 'Categories', 
      value: stats()?.categories || 0, 
      icon: FolderOpen, 
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-violet-50 to-purple-100',
      iconBg: 'bg-violet-500',
      trend: null
    },
  ];

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div class="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
        {/* Hero Header */}
        <div class="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-500/20">
          <div class="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
          <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-2">
              <Sparkles class="w-5 h-5 text-yellow-300" />
              <span class="text-blue-100 text-sm font-medium">{greeting()}, Scholar!</span>
            </div>
            <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
              Your Dental Study Hub
            </h1>
            <p class="text-blue-100 text-sm md:text-base max-w-xl">
              Track progress, organize resources, and master your dental education journey.
            </p>
            
            {/* Quick Stats in Header */}
            <Show when={stats() && stats()!.resources > 0}>
              <div class="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/20">
                <div class="flex items-center gap-2">
                  <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Target class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="text-2xl font-bold">{progressPercent()}%</p>
                    <p class="text-xs text-blue-200">Completed</p>
                  </div>
                </div>
                <div class="w-px h-8 bg-white/20 hidden sm:block" />
                <div class="flex items-center gap-2">
                  <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Clock class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="text-2xl font-bold">{stats()?.byStatus['to-study'] || 0}</p>
                    <p class="text-xs text-blue-200">To Study</p>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>

        {/* Stats Grid */}
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <For each={statCards()}>
            {(stat, index) => (
              <div 
                class={`group relative bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                style={{ 'animation-delay': `${index() * 100}ms` }}
              >
                <div class={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div class="relative z-10">
                  <div class="flex items-start justify-between mb-3">
                    <div class={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                      <stat.icon class="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <Show when={stat.trend}>
                      <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        {stat.trend}
                      </span>
                    </Show>
                  </div>
                  <p class="text-2xl md:text-3xl font-bold text-gray-900 mb-0.5">{stat.value}</p>
                  <p class="text-xs md:text-sm text-gray-500 font-medium">{stat.label}</p>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Progress Section */}
        <Show when={stats() && stats()!.resources > 0}>
          <div class="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <TrendingUp class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Study Progress</h2>
                  <p class="text-xs text-gray-500">Your learning journey</p>
                </div>
              </div>
              <span class="text-2xl font-bold text-indigo-600">{progressPercent()}%</span>
            </div>
            
            {/* Segmented Progress Bar */}
            <div class="h-3 md:h-4 bg-gray-100 rounded-full overflow-hidden mb-4 shadow-inner">
              <div class="h-full flex">
                <div
                  class="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${(stats()!.byStatus.completed / stats()!.resources) * 100}%` }}
                />
                <div
                  class="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${(stats()!.byStatus['in-progress'] / stats()!.resources) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Progress Legend */}
            <div class="grid grid-cols-3 gap-2 md:gap-4">
              <div class="flex items-center gap-2 p-2 md:p-3 bg-emerald-50 rounded-lg">
                <div class="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm" />
                <div>
                  <p class="text-xs font-medium text-gray-600">Completed</p>
                  <p class="text-sm font-semibold text-gray-900">{stats()?.byStatus.completed || 0}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 p-2 md:p-3 bg-blue-50 rounded-lg">
                <div class="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 shadow-sm" />
                <div>
                  <p class="text-xs font-medium text-gray-600">In Progress</p>
                  <p class="text-sm font-semibold text-gray-900">{stats()?.byStatus['in-progress'] || 0}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 p-2 md:p-3 bg-gray-100 rounded-lg">
                <div class="w-3 h-3 rounded-full bg-gray-300 shadow-sm" />
                <div>
                  <p class="text-xs font-medium text-gray-600">To Study</p>
                  <p class="text-sm font-semibold text-gray-900">{stats()?.byStatus['to-study'] || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Recent Resources */}
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <Zap class="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <p class="text-xs text-gray-500">Your latest resources</p>
              </div>
            </div>
            <A 
              href="/resources" 
              class="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              View all
              <ArrowRight class="w-4 h-4" />
            </A>
          </div>
          
          <Show
            when={recentResources() && recentResources()!.length > 0}
            fallback={
              <div class="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-8 md:p-12 text-center shadow-sm">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <BookOpen class="w-8 h-8 text-gray-400" />
                </div>
                <p class="text-gray-900 font-medium mb-1">No resources yet</p>
                <p class="text-sm text-gray-500">Add your first resource to get started</p>
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

        {/* Getting Started - Only for new users */}
        <Show when={!recentResources() || recentResources()!.length === 0}>
          <div class="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 rounded-xl md:rounded-2xl p-6 md:p-8">
            <div class="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-indigo-200/50 to-purple-200/50 rounded-full blur-2xl" />
            <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-gradient-to-br from-pink-200/50 to-rose-200/50 rounded-full blur-2xl" />
            
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <GraduationCap class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Welcome to DentStudy!</h2>
                  <p class="text-sm text-gray-600">Let's build your study library</p>
                </div>
              </div>
              
              <div class="grid sm:grid-cols-2 gap-3 md:gap-4 mt-6">
                <div class="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                  <span class="text-2xl">📺</span>
                  <div>
                    <p class="font-medium text-gray-900 text-sm">YouTube Lectures</p>
                    <p class="text-xs text-gray-600">Save dental lecture videos</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                  <span class="text-2xl">📚</span>
                  <div>
                    <p class="font-medium text-gray-900 text-sm">Textbooks</p>
                    <p class="text-xs text-gray-600">Search Google Books</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                  <span class="text-2xl">📄</span>
                  <div>
                    <p class="font-medium text-gray-900 text-sm">Research Papers</p>
                    <p class="text-xs text-gray-600">Find academic papers</p>
                  </div>
                </div>
                <div class="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                  <span class="text-2xl">🏷️</span>
                  <div>
                    <p class="font-medium text-gray-900 text-sm">Organize</p>
                    <p class="text-xs text-gray-600">Tag with topics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Dashboard;
