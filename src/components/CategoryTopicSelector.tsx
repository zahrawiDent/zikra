/**
 * CategoryTopicSelector - Hierarchical category and topic selection
 * 
 * Features:
 * - Collapsible category sections
 * - Multi-select topics within categories
 * - Visual hierarchy with colors and icons
 * - Inline topic creation
 * - Clean, seamless UX
 */

import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
import { useCategories, useTopics, useTopicsByCategory } from '../lib/db/hooks';
import { createTopic } from '../lib/db/actions';
import { Badge } from './ui';
import { ChevronDown, ChevronRight, Plus, Check, FolderOpen, Folder } from 'lucide-solid';
import type { CategoryTopicMap } from '../lib/db/schema';

interface CategoryTopicSelectorProps {
  /** Selected category-topic mapping */
  selected: CategoryTopicMap;
  /** Called when selection changes */
  onChange: (categoryTopics: CategoryTopicMap) => void;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

export const CategoryTopicSelector: Component<CategoryTopicSelectorProps> = (props) => {
  const { data: categories } = useCategories();
  const topicsByCategory = useTopicsByCategory();
  
  // Track expanded categories
  const [expandedCategories, setExpandedCategories] = createSignal<Set<string>>(new Set());
  
  // Track which category is adding a new topic
  const [addingTopicTo, setAddingTopicTo] = createSignal<string | null>(null);
  const [newTopicName, setNewTopicName] = createSignal('');

  // Check if a category has any selected topics
  const categoryHasSelections = (categoryId: string) => {
    return props.selected[categoryId] && props.selected[categoryId].length > 0;
  };

  // Count selected topics in a category
  const selectedCount = (categoryId: string) => {
    return props.selected[categoryId]?.length || 0;
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
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

  // Check if category is expanded
  const isExpanded = (categoryId: string) => {
    return expandedCategories().has(categoryId);
  };

  // Toggle category selection (adds/removes entire category)
  const toggleCategorySelection = (categoryId: string) => {
    const newSelected = { ...props.selected };
    if (newSelected[categoryId]) {
      delete newSelected[categoryId];
    } else {
      newSelected[categoryId] = [];
      // Auto-expand when selected
      setExpandedCategories(prev => new Set([...prev, categoryId]));
    }
    props.onChange(newSelected);
  };

  // Toggle topic selection within a category
  const toggleTopic = (categoryId: string, topicId: string) => {
    const newSelected = { ...props.selected };
    
    // Ensure category exists in selection
    if (!newSelected[categoryId]) {
      newSelected[categoryId] = [];
    }
    
    // Toggle topic
    const topicIndex = newSelected[categoryId].indexOf(topicId);
    if (topicIndex >= 0) {
      newSelected[categoryId] = newSelected[categoryId].filter(id => id !== topicId);
      // Remove category if no topics left
      if (newSelected[categoryId].length === 0) {
        delete newSelected[categoryId];
      }
    } else {
      newSelected[categoryId] = [...newSelected[categoryId], topicId];
    }
    
    props.onChange(newSelected);
  };

  // Check if topic is selected
  const isTopicSelected = (categoryId: string, topicId: string) => {
    return props.selected[categoryId]?.includes(topicId) || false;
  };

  // Handle creating new topic
  const handleCreateTopic = (categoryId: string) => {
    const name = newTopicName().trim();
    if (!name) return;
    
    const topic = createTopic({ name, categoryId });
    
    // Auto-select the new topic
    const newSelected = { ...props.selected };
    if (!newSelected[categoryId]) {
      newSelected[categoryId] = [];
    }
    newSelected[categoryId] = [...newSelected[categoryId], topic.id];
    props.onChange(newSelected);
    
    // Reset state
    setNewTopicName('');
    setAddingTopicTo(null);
  };

  return (
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        Categories & Topics
      </label>
      
      <div class={`border rounded-lg divide-y bg-white ${props.compact ? 'max-h-48 overflow-y-auto' : ''}`}>
        <For each={categories()}>
          {(category) => {
            const categoryTopics = () => topicsByCategory().get(category.id) || [];
            const hasSelection = () => categoryHasSelections(category.id);
            const count = () => selectedCount(category.id);
            const expanded = () => isExpanded(category.id);
            
            return (
              <div class="relative">
                {/* Category Header */}
                <div 
                  class={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    hasSelection() ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {/* Expand/Collapse */}
                  <button
                    type="button"
                    class="p-0.5 hover:bg-gray-200 rounded"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {expanded() ? (
                      <ChevronDown class="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight class="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {/* Category checkbox */}
                  <button
                    type="button"
                    class={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      hasSelection() 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => toggleCategorySelection(category.id)}
                  >
                    <Show when={hasSelection()}>
                      <Check class="w-3 h-3 text-white" />
                    </Show>
                  </button>
                  
                  {/* Icon & Name */}
                  <span class="text-lg">{category.icon}</span>
                  <span 
                    class="flex-1 font-medium text-sm cursor-pointer"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </span>
                  
                  {/* Selection count badge */}
                  <Show when={count() > 0}>
                    <span 
                      class="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ 
                        'background-color': `${category.color}20`,
                        color: category.color 
                      }}
                    >
                      {count()}
                    </span>
                  </Show>
                </div>
                
                {/* Topics (collapsible) */}
                <Show when={expanded()}>
                  <div class="pl-10 pr-3 pb-2 space-y-1">
                    <For each={categoryTopics()}>
                      {(topic) => {
                        const selected = () => isTopicSelected(category.id, topic.id);
                        return (
                          <button
                            type="button"
                            class={`w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-left transition-colors ${
                              selected()
                                ? 'bg-blue-100 text-blue-800'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                            onClick={() => toggleTopic(category.id, topic.id)}
                          >
                            <div 
                              class={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                selected()
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              <Show when={selected()}>
                                <Check class="w-2.5 h-2.5 text-white" />
                              </Show>
                            </div>
                            <span 
                              class="w-2 h-2 rounded-full" 
                              style={{ 'background-color': topic.color }}
                            />
                            {topic.name}
                          </button>
                        );
                      }}
                    </For>
                    
                    {/* Add new topic */}
                    <Show 
                      when={addingTopicTo() === category.id}
                      fallback={
                        <button
                          type="button"
                          class="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          onClick={() => setAddingTopicTo(category.id)}
                        >
                          <Plus class="w-3 h-3" />
                          Add topic
                        </button>
                      }
                    >
                      <div class="flex items-center gap-1">
                        <input
                          type="text"
                          class="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Topic name"
                          value={newTopicName()}
                          onInput={(e) => setNewTopicName(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateTopic(category.id);
                            if (e.key === 'Escape') {
                              setAddingTopicTo(null);
                              setNewTopicName('');
                            }
                          }}
                          autofocus
                        />
                        <button
                          type="button"
                          class="px-2 py-1 text-xs text-blue-600 hover:text-blue-700"
                          onClick={() => handleCreateTopic(category.id)}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                          onClick={() => {
                            setAddingTopicTo(null);
                            setNewTopicName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </Show>
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
        
        {/* Empty state */}
        <Show when={categories().length === 0}>
          <div class="p-4 text-center text-gray-500 text-sm">
            No categories yet. Create them in Settings.
          </div>
        </Show>
      </div>
      
      {/* Selected summary */}
      <Show when={Object.keys(props.selected).length > 0}>
        <div class="flex flex-wrap gap-1 pt-1">
          <For each={categories().filter(c => props.selected[c.id])}>
            {(category) => (
              <div class="flex items-center gap-1">
                <span 
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    'background-color': `${category.color}15`,
                    color: category.color 
                  }}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                  <Show when={props.selected[category.id]?.length > 0}>
                    <span class="opacity-75">
                      ({props.selected[category.id].length})
                    </span>
                  </Show>
                </span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default CategoryTopicSelector;
