/**
 * ResourceCategoryDisplay - Compact display of resource's categories and topics
 * 
 * Features:
 * - Shows only assigned categories and their topics
 * - Compact view by default
 * - Edit mode to add/remove categories and topics
 * - Inline editing without full modal
 */

import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
import { useCategories, useTopicsByCategory } from '../lib/db/hooks';
import type { CategoryTopicMap, Category, Topic } from '../lib/db/schema';
import { Badge, Modal } from './ui';
import { CategoryTopicSelector } from './CategoryTopicSelector';
import { Pencil, X, Check, Plus, Tag, FolderOpen } from 'lucide-solid';

interface ResourceCategoryDisplayProps {
  /** Current category-topic mapping for this resource */
  categoryTopics: CategoryTopicMap;
  /** Called when categories/topics change */
  onChange: (categoryTopics: CategoryTopicMap) => void;
}

export const ResourceCategoryDisplay: Component<ResourceCategoryDisplayProps> = (props) => {
  const { data: allCategories } = useCategories();
  const topicsByCategory = useTopicsByCategory();
  
  const [isEditing, setIsEditing] = createSignal(false);
  const [editingCategoryTopics, setEditingCategoryTopics] = createSignal<CategoryTopicMap>({});

  // Get the categories that are assigned to this resource
  const assignedCategories = createMemo(() => {
    const categoryIds = Object.keys(props.categoryTopics);
    return (allCategories() || []).filter(c => categoryIds.includes(c.id));
  });

  // Get topics for a specific category that are assigned to this resource
  const getAssignedTopics = (categoryId: string): Topic[] => {
    const topicIds = props.categoryTopics[categoryId] || [];
    const allTopics = topicsByCategory().get(categoryId) || [];
    return allTopics.filter(t => topicIds.includes(t.id));
  };

  // Start editing
  const startEditing = () => {
    setEditingCategoryTopics({ ...props.categoryTopics });
    setIsEditing(true);
  };

  // Save changes
  const saveChanges = () => {
    props.onChange(editingCategoryTopics());
    setIsEditing(false);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditingCategoryTopics({});
  };

  // Quick remove a category
  const removeCategory = (categoryId: string) => {
    const newCategoryTopics = { ...props.categoryTopics };
    delete newCategoryTopics[categoryId];
    props.onChange(newCategoryTopics);
  };

  // Quick remove a topic from a category
  const removeTopic = (categoryId: string, topicId: string) => {
    const newCategoryTopics = { ...props.categoryTopics };
    if (newCategoryTopics[categoryId]) {
      newCategoryTopics[categoryId] = newCategoryTopics[categoryId].filter(id => id !== topicId);
      // Remove category if no topics left
      if (newCategoryTopics[categoryId].length === 0) {
        delete newCategoryTopics[categoryId];
      }
    }
    props.onChange(newCategoryTopics);
  };

  const hasAssignments = () => Object.keys(props.categoryTopics).length > 0;

  return (
    <div class="space-y-3">
      {/* Header */}
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-700">Categories & Topics</h3>
        <button
          type="button"
          class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          onClick={startEditing}
        >
          <Pencil class="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      {/* Display Mode */}
      <Show
        when={hasAssignments()}
        fallback={
          <button
            type="button"
            class="w-full py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex flex-col items-center gap-2"
            onClick={startEditing}
          >
            <FolderOpen class="w-8 h-8" />
            <span class="text-sm">No categories assigned</span>
            <span class="text-xs">Click to add categories and topics</span>
          </button>
        }
      >
        <div class="space-y-3">
          <For each={assignedCategories()}>
            {(category) => {
              const topics = () => getAssignedTopics(category.id);
              
              return (
                <div class="group relative">
                  {/* Category header */}
                  <div class="flex items-center gap-2 mb-1.5">
                    <span 
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium"
                      style={{ 
                        'background-color': `${category.color}15`,
                        color: category.color 
                      }}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </span>
                    
                    {/* Quick remove category button */}
                    <button
                      type="button"
                      class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      onClick={() => removeCategory(category.id)}
                      title="Remove category"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {/* Topics */}
                  <Show when={topics().length > 0}>
                    <div class="flex flex-wrap gap-1.5 pl-4 border-l-2" style={{ 'border-color': `${category.color}30` }}>
                      <For each={topics()}>
                        {(topic) => (
                          <span class="group/topic inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors">
                            <span 
                              class="w-1.5 h-1.5 rounded-full" 
                              style={{ 'background-color': topic.color }}
                            />
                            {topic.name}
                            <button
                              type="button"
                              class="opacity-0 group-hover/topic:opacity-100 ml-0.5 text-gray-400 hover:text-red-500 transition-opacity"
                              onClick={() => removeTopic(category.id, topic.id)}
                              title="Remove topic"
                            >
                              <X class="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>
                  
                  {/* No topics indicator */}
                  <Show when={topics().length === 0}>
                    <p class="pl-4 text-xs text-gray-400 italic border-l-2" style={{ 'border-color': `${category.color}30` }}>
                      No specific topics selected
                    </p>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Edit Modal */}
      <Modal
        open={isEditing()}
        onClose={cancelEditing}
        title="Edit Categories & Topics"
      >
        <div class="space-y-4">
          <CategoryTopicSelector
            selected={editingCategoryTopics()}
            onChange={setEditingCategoryTopics}
          />
          
          <div class="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              onClick={cancelEditing}
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              onClick={saveChanges}
            >
              <Check class="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResourceCategoryDisplay;
