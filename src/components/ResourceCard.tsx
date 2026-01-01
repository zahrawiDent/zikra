import { type Component, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import type { Resource, Category } from '../lib/db/schema';
import { parseCategoryTopics } from '../lib/db/schema';
import { pluginRegistry } from '../lib/plugins';
import { Badge, ThumbnailImage } from './ui';
import { ExternalLink, Clock, CheckCircle, BookOpen } from 'lucide-solid';

interface ResourceCardProps {
  resource: Resource;
  categories: Category[];
}

export const ResourceCard: Component<ResourceCardProps> = (props) => {
  const plugin = () => pluginRegistry.get(props.resource.type);
  
  // Get categories this resource belongs to
  const resourceCategories = createMemo(() => {
    const categoryTopics = parseCategoryTopics(props.resource.categoryTopics);
    const categoryIds = Object.keys(categoryTopics);
    return props.categories.filter(c => categoryIds.includes(c.id));
  });

  const statusIcon = () => {
    switch (props.resource.status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return BookOpen;
      default: return Clock;
    }
  };

  const statusColor = () => {
    switch (props.resource.status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  const StatusIcon = statusIcon();

  return (
    <A
      href={`/resource/${props.resource.id}`}
      class="block bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
    >
      <div class="flex">
        {/* Thumbnail */}
        <Show when={props.resource.thumbnail}>
          <div class="w-24 flex-shrink-0 flex items-center justify-center bg-gray-50">
            <ThumbnailImage
              src={props.resource.thumbnail}
              class="w-full h-auto object-contain max-h-32"
            />
          </div>
        </Show>
        
        {/* Content */}
        <div class="flex-1 p-4 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              {/* Type badge */}
              <div class="flex items-center gap-2 mb-1">
                <Show when={plugin()}>
                  {(p) => {
                    const Icon = p().icon;
                    return (
                      <span
                        class="inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: p().color }}
                      >
                        <Icon class="w-3 h-3" />
                        {p().name}
                      </span>
                    );
                  }}
                </Show>
              </div>
              
              {/* Title */}
              <h3 class="font-medium text-gray-900 truncate">{props.resource.title}</h3>
              
              {/* Description */}
              <Show when={props.resource.description}>
                <p class="text-sm text-gray-500 truncate mt-0.5">
                  {props.resource.description}
                </p>
              </Show>
            </div>
            
            {/* Status */}
            <StatusIcon class={`w-5 h-5 flex-shrink-0 ${statusColor()}`} />
          </div>
          
          {/* Categories */}
          <Show when={resourceCategories().length > 0}>
            <div class="flex flex-wrap gap-1 mt-2">
              <For each={resourceCategories().slice(0, 3)}>
                {(category) => (
                  <span 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      'background-color': `${category.color}15`,
                      color: category.color 
                    }}
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </span>
                )}
              </For>
              <Show when={resourceCategories().length > 3}>
                <Badge>+{resourceCategories().length - 3}</Badge>
              </Show>
            </div>
          </Show>
        </div>
        
        {/* External link indicator */}
        <Show when={props.resource.url}>
          <div class="flex items-center pr-4">
            <ExternalLink class="w-4 h-4 text-gray-400" />
          </div>
        </Show>
      </div>
    </A>
  );
};
