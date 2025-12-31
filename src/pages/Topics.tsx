import { type Component, For, Show, createSignal, createEffect } from 'solid-js';
import { A } from '@solidjs/router';
import { useTopics, useResources } from '../lib/db/hooks';
import { createTopic, updateTopic, deleteTopic } from '../lib/db/actions';
import { Button, Input, Modal, ConfirmDialog } from '../components/ui';
import { Plus, Edit2, Trash2, Tag } from 'lucide-solid';
import { parseTopicIds } from '../lib/db/schema';

export const Topics: Component = () => {
  const { data: topics } = useTopics();
  const { data: resources } = useResources();
  const [showModal, setShowModal] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [name, setName] = createSignal('');
  const [color, setColor] = createSignal('#3b82f6');
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [topicToDelete, setTopicToDelete] = createSignal<string | null>(null);

  // Compute resource counts reactively
  const resourceCounts = () => {
    const counts: Record<string, number> = {};
    const allResources = resources() || [];
    for (const resource of allResources) {
      const topicIds = parseTopicIds(resource.topicIds);
      for (const topicId of topicIds) {
        counts[topicId] = (counts[topicId] || 0) + 1;
      }
    }
    return counts;
  };

  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
  ];

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setColor(colors[Math.floor(Math.random() * colors.length)]);
    setShowModal(true);
  };

  const openEdit = (topic: { id: string; name: string; color: string }) => {
    setEditingId(topic.id);
    setName(topic.name);
    setColor(topic.color);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name().trim()) return;
    
    if (editingId()) {
      updateTopic(editingId()!, { name: name().trim(), color: color() });
    } else {
      createTopic({ name: name().trim(), color: color() });
    }
    
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setTopicToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    const id = topicToDelete();
    if (id) {
      deleteTopic(id);
    }
  };

  return (
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Topics</h1>
          <p class="text-gray-600 mt-1">Organize your resources by dental topics</p>
        </div>
        <Button onClick={openCreate}>
          <Plus class="w-4 h-4" /> New Topic
        </Button>
      </div>

      <Show
        when={topics() && topics()!.length > 0}
        fallback={
          <div class="text-center py-12 bg-white border rounded-xl">
            <Tag class="w-12 h-12 text-gray-300 mx-auto" />
            <p class="text-gray-500 mt-2">No topics yet</p>
            <Button class="mt-4" onClick={openCreate}>
              <Plus class="w-4 h-4" /> Create your first topic
            </Button>
          </div>
        }
      >
        <div class="grid grid-cols-2 gap-4">
          <For each={topics()}>
            {(topic) => (
              <div class="bg-white border rounded-xl p-4 flex items-center justify-between">
                <A
                  href={`/resources?topic=${topic.id}`}
                  class="flex items-center gap-3 flex-1"
                >
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ 'background-color': `${topic.color}20` }}
                  >
                    <Tag class="w-5 h-5" style={{ color: topic.color }} />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{topic.name}</p>
                    <p class="text-sm text-gray-500">
                      {resourceCounts()[topic.id] || 0} resources
                    </p>
                  </div>
                </A>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    onClick={() => openEdit(topic)}
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    onClick={() => handleDelete(topic.id)}
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal()}
        onClose={() => setShowModal(false)}
        title={editingId() ? 'Edit Topic' : 'New Topic'}
      >
        <div class="space-y-4">
          <Input
            label="Topic Name"
            placeholder="e.g., Endodontics"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
          />
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div class="flex flex-wrap gap-2">
              <For each={colors}>
                {(c) => (
                  <button
                    type="button"
                    class={`w-8 h-8 rounded-full ${color() === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ 'background-color': c }}
                    onClick={() => setColor(c)}
                  />
                )}
              </For>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId() ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm()}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Topic"
        message="Are you sure you want to delete this topic? It will be removed from all resources."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Topics;
