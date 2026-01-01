/**
 * Categories Page - Manage dental specialties and their topics
 * 
 * Features:
 * - Create, edit, delete categories
 * - Nested topic management within each category
 * - Visual hierarchy with icons and colors
 * - Resource counts per category/topic
 */

import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { 
  useCategories, useTopics, useTopicsByCategory, 
  useCategoryTopicCounts 
} from '../lib/db/hooks';
import { 
  createCategory, updateCategory, deleteCategory,
  createTopic, updateTopic, deleteTopic 
} from '../lib/db/actions';
import { Button, Input, Modal, ConfirmDialog } from '../components/ui';
import { 
  Plus, Edit2, Trash2, FolderOpen, ChevronDown, ChevronRight,
  Tag, GripVertical, Palette
} from 'lucide-solid';

// Default category icons
const CATEGORY_ICONS = ['🦷', '🔬', '👑', '🩺', '⚕️', '📐', '👶', '🔍', '💊', '📚', '🧬', '🔧'];
const CATEGORY_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#22c55e', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#eab308', '#6366f1', '#14b8a6'
];

export const Categories: Component = () => {
  const { data: categories } = useCategories();
  const topicsByCategory = useTopicsByCategory();
  const counts = useCategoryTopicCounts();
  
  // Modal state
  const [showCategoryModal, setShowCategoryModal] = createSignal(false);
  const [showTopicModal, setShowTopicModal] = createSignal(false);
  const [editingCategoryId, setEditingCategoryId] = createSignal<string | null>(null);
  const [editingTopicId, setEditingTopicId] = createSignal<string | null>(null);
  const [parentCategoryId, setParentCategoryId] = createSignal<string | null>(null);
  
  // Form state
  const [categoryName, setCategoryName] = createSignal('');
  const [categoryColor, setCategoryColor] = createSignal(CATEGORY_COLORS[0]);
  const [categoryIcon, setCategoryIcon] = createSignal(CATEGORY_ICONS[0]);
  const [topicName, setTopicName] = createSignal('');
  const [topicColor, setTopicColor] = createSignal('');
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [deleteTarget, setDeleteTarget] = createSignal<{ type: 'category' | 'topic'; id: string; name: string } | null>(null);
  
  // Expanded categories
  const [expandedCategories, setExpandedCategories] = createSignal<Set<string>>(new Set());

  const toggleExpand = (categoryId: string) => {
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

  // Open create category modal
  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    setCategoryIcon(CATEGORY_ICONS[Math.floor(Math.random() * CATEGORY_ICONS.length)]);
    setShowCategoryModal(true);
  };

  // Open edit category modal
  const openEditCategory = (category: { id: string; name: string; color: string; icon: string }) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryColor(category.color);
    setCategoryIcon(category.icon);
    setShowCategoryModal(true);
  };

  // Open create topic modal
  const openCreateTopic = (categoryId: string) => {
    setParentCategoryId(categoryId);
    setEditingTopicId(null);
    setTopicName('');
    // Inherit color from category
    const category = categories()?.find(c => c.id === categoryId);
    setTopicColor(category?.color || CATEGORY_COLORS[0]);
    setShowTopicModal(true);
  };

  // Open edit topic modal
  const openEditTopic = (topic: { id: string; name: string; color: string; categoryId: string }) => {
    setParentCategoryId(topic.categoryId);
    setEditingTopicId(topic.id);
    setTopicName(topic.name);
    setTopicColor(topic.color);
    setShowTopicModal(true);
  };

  // Save category
  const handleSaveCategory = () => {
    if (!categoryName().trim()) return;
    
    if (editingCategoryId()) {
      updateCategory(editingCategoryId()!, { 
        name: categoryName().trim(), 
        color: categoryColor(),
        icon: categoryIcon()
      });
    } else {
      createCategory({ 
        name: categoryName().trim(), 
        color: categoryColor(),
        icon: categoryIcon()
      });
    }
    
    setShowCategoryModal(false);
  };

  // Save topic
  const handleSaveTopic = () => {
    if (!topicName().trim() || !parentCategoryId()) return;
    
    if (editingTopicId()) {
      updateTopic(editingTopicId()!, { 
        name: topicName().trim(), 
        color: topicColor()
      });
    } else {
      createTopic({ 
        name: topicName().trim(), 
        categoryId: parentCategoryId()!,
        color: topicColor()
      });
    }
    
    setShowTopicModal(false);
  };

  // Handle delete
  const handleDelete = (type: 'category' | 'topic', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    const target = deleteTarget();
    if (!target) return;
    
    if (target.type === 'category') {
      deleteCategory(target.id);
    } else {
      deleteTopic(target.id);
    }
  };

  return (
    <div class="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-gray-900">Categories & Topics</h1>
          <p class="text-gray-600 mt-1 text-sm md:text-base">Organize your resources by dental specialties</p>
        </div>
        <Button onClick={openCreateCategory} class="self-start sm:self-auto">
          <Plus class="w-4 h-4" /> New Category
        </Button>
      </div>

      {/* Categories List */}
      <Show
        when={categories() && categories()!.length > 0}
        fallback={
          <div class="text-center py-8 md:py-12 bg-white border rounded-xl">
            <FolderOpen class="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto" />
            <p class="text-gray-500 mt-2">No categories yet</p>
            <Button class="mt-4" onClick={openCreateCategory}>
              <Plus class="w-4 h-4" /> Create your first category
            </Button>
          </div>
        }
      >
        <div class="space-y-3">
          <For each={categories()}>
            {(category) => {
              const topics = () => topicsByCategory().get(category.id) || [];
              const resourceCount = () => counts().byCategory.get(category.id) || 0;
              const expanded = () => isExpanded(category.id);
              
              return (
                <div class="bg-white border rounded-xl overflow-hidden">
                  {/* Category Header */}
                  <div class="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                    {/* Expand toggle */}
                    <button
                      type="button"
                      class="p-1 hover:bg-gray-100 rounded transition-colors touch-target flex items-center justify-center"
                      onClick={() => toggleExpand(category.id)}
                    >
                      {expanded() ? (
                        <ChevronDown class="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight class="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    
                    {/* Icon */}
                    <div
                      class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
                      style={{ 'background-color': `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    
                    {/* Name & stats */}
                    <A
                      href={`/resources?category=${category.id}`}
                      class="flex-1 min-w-0 cursor-pointer hover:text-blue-600"
                    >
                      <p class="font-semibold text-gray-900 truncate">{category.name}</p>
                      <p class="text-xs sm:text-sm text-gray-500">
                        {topics().length} topics • {resourceCount()} resources
                      </p>
                    </A>
                    
                    {/* Actions - condensed on mobile */}
                    <div class="flex items-center gap-0.5 sm:gap-1">
                      <button
                        type="button"
                        class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => openCreateTopic(category.id)}
                        title="Add topic"
                      >
                        <Plus class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
                        onClick={() => openEditCategory(category)}
                        title="Edit category"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors hidden sm:block"
                        onClick={() => handleDelete('category', category.id, category.name)}
                        title="Delete category"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Topics List (collapsible) */}
                  <Show when={expanded()}>
                    {/* Mobile action buttons when expanded */}
                    <div class="flex items-center gap-2 px-4 pb-2 sm:hidden">
                      <button
                        type="button"
                        class="text-xs text-gray-500 hover:text-gray-700"
                        onClick={() => openEditCategory(category)}
                      >
                        Edit
                      </button>
                      <span class="text-gray-300">•</span>
                      <button
                        type="button"
                        class="text-xs text-red-500 hover:text-red-700"
                        onClick={() => handleDelete('category', category.id, category.name)}
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div class="border-t bg-gray-50/50">
                      <Show
                        when={topics().length > 0}
                        fallback={
                          <div class="p-4 text-center">
                            <p class="text-sm text-gray-500">No topics yet</p>
                            <button
                              type="button"
                              class="text-sm text-blue-600 hover:text-blue-700 mt-1"
                              onClick={() => openCreateTopic(category.id)}
                            >
                              Add first topic
                            </button>
                          </div>
                        }
                      >
                        <div class="divide-y">
                          <For each={topics()}>
                            {(topic) => {
                              const topicCount = () => counts().byTopic.get(topic.id) || 0;
                              
                              return (
                                <div class="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 pl-10 sm:pl-14 hover:bg-gray-50 active:bg-gray-100">
                                  <span
                                    class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                    style={{ 'background-color': topic.color }}
                                  />
                                  <A
                                    href={`/resources?category=${category.id}&topic=${topic.id}`}
                                    class="flex-1 min-w-0 hover:text-blue-600"
                                  >
                                    <span class="text-sm font-medium text-gray-700 truncate block">{topic.name}</span>
                                  </A>
                                  <span class="text-xs text-gray-500 flex-shrink-0">{topicCount()}</span>
                                  <div class="flex items-center gap-0.5 sm:gap-1">
                                    <button
                                      type="button"
                                      class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                      onClick={() => openEditTopic(topic)}
                                    >
                                      <Edit2 class="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                      onClick={() => handleDelete('topic', topic.id, topic.name)}
                                    >
                                      <Trash2 class="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            }}
                          </For>
                        </div>
                        
                        {/* Add topic button at bottom */}
                        <button
                          type="button"
                          class="w-full flex items-center gap-2 px-3 sm:px-4 py-2 pl-10 sm:pl-14 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                          onClick={() => openCreateTopic(category.id)}
                        >
                          <Plus class="w-4 h-4" />
                          <span class="truncate">Add topic</span>
                        </button>
                      </Show>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Category Modal */}
      <Modal
        open={showCategoryModal()}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategoryId() ? 'Edit Category' : 'New Category'}
      >
        <div class="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g., Endodontics"
            value={categoryName()}
            onInput={(e) => setCategoryName(e.currentTarget.value)}
          />
          
          {/* Icon picker */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div class="flex flex-wrap gap-2">
              <For each={CATEGORY_ICONS}>
                {(icon) => (
                  <button
                    type="button"
                    class={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      categoryIcon() === icon
                        ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => setCategoryIcon(icon)}
                  >
                    {icon}
                  </button>
                )}
              </For>
            </div>
          </div>
          
          {/* Color picker */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div class="flex flex-wrap gap-2">
              <For each={CATEGORY_COLORS}>
                {(color) => (
                  <button
                    type="button"
                    class={`w-8 h-8 rounded-full transition-all ${
                      categoryColor() === color
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-110'
                    }`}
                    style={{ 'background-color': color }}
                    onClick={() => setCategoryColor(color)}
                  />
                )}
              </For>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={!categoryName().trim()}>
              {editingCategoryId() ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Topic Modal */}
      <Modal
        open={showTopicModal()}
        onClose={() => setShowTopicModal(false)}
        title={editingTopicId() ? 'Edit Topic' : 'New Topic'}
      >
        <div class="space-y-4">
          <Input
            label="Topic Name"
            placeholder="e.g., Working Length"
            value={topicName()}
            onInput={(e) => setTopicName(e.currentTarget.value)}
          />
          
          {/* Color picker */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div class="flex flex-wrap gap-2">
              <For each={CATEGORY_COLORS}>
                {(color) => (
                  <button
                    type="button"
                    class={`w-8 h-8 rounded-full transition-all ${
                      topicColor() === color
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-110'
                    }`}
                    style={{ 'background-color': color }}
                    onClick={() => setTopicColor(color)}
                  />
                )}
              </For>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowTopicModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTopic} disabled={!topicName().trim()}>
              {editingTopicId() ? 'Save Changes' : 'Create Topic'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm()}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget()?.type === 'category' ? 'Category' : 'Topic'}`}
        message={
          deleteTarget()?.type === 'category'
            ? `Are you sure you want to delete "${deleteTarget()?.name}"? This will also delete all topics within this category. Resources will be untagged.`
            : `Are you sure you want to delete "${deleteTarget()?.name}"? Resources will be untagged from this topic.`
        }
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Categories;
