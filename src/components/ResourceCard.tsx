import { type Component, For, Show, createMemo } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { A } from '@solidjs/router';
import type { Resource, Category } from '../lib/db/schema';
import { parseCategoryTopics } from '../lib/db/schema';
import { pluginRegistry } from '../lib/plugins';
import { Badge, ThumbnailImage } from './ui';
import { ExternalLink, Clock, CheckCircle2, PlayCircle, ArrowUpRight } from 'lucide-solid';

interface ResourceCardProps {
  resource: Resource;
  categories: Category[];
  compact?: boolean;
}

export const ResourceCard: Component<ResourceCardProps> = (props) => {
  const plugin = () => pluginRegistry.get(props.resource.type);
  
  // Get categories this resource belongs to
  const resourceCategories = createMemo(() => {
    const categoryTopics = parseCategoryTopics(props.resource.categoryTopics);
    const categoryIds = Object.keys(categoryTopics);
    return props.categories.filter(c => categoryIds.includes(c.id));
  });

  const statusConfig = createMemo(() => {
    switch (props.resource.status) {
      case 'completed': 
        return { 
          icon: CheckCircle2, 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          label: 'Completed' 
        };
      case 'in-progress': 
        return { 
          icon: PlayCircle, 
          color: 'text-blue-600', 
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'In Progress' 
        };
      default: 
        return { 
          icon: Clock, 
          color: 'text-gray-400', 
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'To Study' 
        };
    }
  });

  // Compact card for grid view
  if (props.compact) {
    return (
      <A
        href={`/resource/${props.resource.id}`}
        class="group block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1"
      >
        {/* Thumbnail */}
        <div class="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
          <Show 
            when={props.resource.thumbnail}
            fallback={
              <div class="absolute inset-0 flex items-center justify-center">
                <Show when={plugin()}>
                  {(p) => {
                    const PluginIcon = p().icon;
                    return (
                      <div 
                        class="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ 'background-color': `${p().color}15`, color: p().color }}
                      >
                        <PluginIcon class="w-7 h-7" />
                      </div>
                    );
                  }}
                </Show>
              </div>
            }
          >
            <ThumbnailImage
              src={props.resource.thumbnail}
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Show>
          
          {/* Status Badge Overlay */}
          <div class="absolute top-2 right-2">
            <div class={`p-1.5 rounded-lg ${statusConfig().bg} ${statusConfig().border} border backdrop-blur-sm`}>
              <Dynamic component={statusConfig().icon} class={`w-4 h-4 ${statusConfig().color}`} />
            </div>
          </div>
          
          {/* Type Badge Overlay */}
          <Show when={plugin()}>
            {(p) => {
              const PluginIcon = p().icon;
              return (
                <div class="absolute bottom-2 left-2">
                  <span 
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm"
                    style={{ 
                      'background-color': `${p().color}20`,
                      color: p().color 
                    }}
                  >
                    <PluginIcon class="w-3 h-3" />
                    {p().name}
                  </span>
                </div>
              );
            }}
          </Show>
        </div>
        
        {/* Content */}
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 line-clamp-2 text-sm mb-1 group-hover:text-blue-600 transition-colors">
            {props.resource.title}
          </h3>
          
          <Show when={props.resource.description}>
            <p class="text-xs text-gray-500 line-clamp-2 mb-3">
              {props.resource.description}
            </p>
          </Show>
          
          {/* Categories */}
          <Show when={resourceCategories().length > 0}>
            <div class="flex flex-wrap gap-1">
              <For each={resourceCategories().slice(0, 2)}>
                {(category) => (
                  <span 
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium"
                    style={{ 
                      'background-color': `${category.color}15`,
                      color: category.color 
                    }}
                  >
                    <span>{category.icon}</span>
                  </span>
                )}
              </For>
              <Show when={resourceCategories().length > 2}>
                <span class="text-xs text-gray-400">+{resourceCategories().length - 2}</span>
              </Show>
            </div>
          </Show>
        </div>
      </A>
    );
  }

  // Full list card
  return (
    <A
      href={`/resource/${props.resource.id}`}
      class="group block bg-white border border-gray-100 rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div class="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div class="relative w-full sm:w-36 md:w-44 h-40 sm:h-auto flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-50">
          <Show 
            when={props.resource.thumbnail}
            fallback={
              <div class="absolute inset-0 flex items-center justify-center">
                <Show when={plugin()}>
                  {(p) => {
                    const PluginIcon = p().icon;
                    return (
                      <div 
                        class="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ 'background-color': `${p().color}15`, color: p().color }}
                      >
                        <PluginIcon class="w-7 h-7" />
                      </div>
                    );
                  }}
                </Show>
              </div>
            }
          >
            <ThumbnailImage
              src={props.resource.thumbnail}
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Show>
          
          {/* Type Badge on Thumbnail */}
          <Show when={plugin()}>
            {(p) => {
              const PluginIcon = p().icon;
              return (
                <div class="absolute bottom-2 left-2 sm:bottom-2 sm:left-2">
                  <span 
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm shadow-sm"
                    style={{ 
                      'background-color': `${p().color}15`,
                      color: p().color 
                    }}
                  >
                    <PluginIcon class="w-3 h-3" />
                    {p().name}
                  </span>
                </div>
              );
            }}
          </Show>
        </div>
        
        {/* Content */}
        <div class="flex-1 p-4 sm:p-5 min-w-0 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 line-clamp-2 sm:line-clamp-1 text-base group-hover:text-blue-600 transition-colors">
                  {props.resource.title}
                </h3>
              </div>
              
              {/* Status Badge */}
              <div class={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusConfig().bg} ${statusConfig().border} border flex-shrink-0`}>
                <Dynamic component={statusConfig().icon} class={`w-3.5 h-3.5 ${statusConfig().color}`} />
                <span class={`text-xs font-medium ${statusConfig().color} hidden sm:inline`}>
                  {statusConfig().label}
                </span>
              </div>
            </div>
            
            {/* Description */}
            <Show when={props.resource.description}>
              <p class="text-sm text-gray-500 line-clamp-2 mb-3">
                {props.resource.description}
              </p>
            </Show>
          </div>
          
          {/* Footer */}
          <div class="flex items-center justify-between gap-3 mt-auto">
            {/* Categories */}
            <Show when={resourceCategories().length > 0}>
              <div class="flex flex-wrap gap-1.5">
                <For each={resourceCategories().slice(0, 3)}>
                  {(category) => (
                    <span 
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                      style={{ 
                        'background-color': `${category.color}15`,
                        color: category.color 
                      }}
                    >
                      <span>{category.icon}</span>
                      <span class="hidden sm:inline">{category.name}</span>
                    </span>
                  )}
                </For>
                <Show when={resourceCategories().length > 3}>
                  <Badge>+{resourceCategories().length - 3}</Badge>
                </Show>
              </div>
            </Show>
            
            {/* View indicator */}
            <div class="flex items-center gap-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <span class="text-xs font-medium hidden sm:inline">View details</span>
              <ArrowUpRight class="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </A>
  );
};
