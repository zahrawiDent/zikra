import { type Component, For, Show, createSignal } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { useResource, useNotes, useThumbnail } from '../lib/db/hooks';
import { updateResourceStatus, deleteResource, createNote, deleteNote, updateNote } from '../lib/db/actions';
import { pluginRegistry } from '../lib/plugins';
import { Button, Input, Textarea, ThumbnailInput, ConfirmDialog } from '../components/ui';
import { TopicSelector } from '../components';
import { updateResource } from '../lib/db/actions';
import { parseTopicIds } from '../lib/db/schema';
import {
  ArrowLeft, ExternalLink, Trash2, Clock, BookOpen, CircleCheck,
  Plus, Lightbulb, CircleHelp, TriangleAlert, Zap, FileText, Pencil, X, Check, Star
} from 'lucide-solid';

const noteTypes = [
  { id: 'summary', label: 'Summary', icon: FileText, color: '#3b82f6' },
  { id: 'pearl', label: 'Clinical Pearl', icon: Lightbulb, color: '#eab308' },
  { id: 'question', label: 'Question', icon: CircleHelp, color: '#8b5cf6' },
  { id: 'disagreement', label: 'Disagreement', icon: TriangleAlert, color: '#ef4444' },
  { id: 'action', label: 'Action Item', icon: Zap, color: '#22c55e' },
  { id: 'general', label: 'General', icon: FileText, color: '#6b7280' },
] as const;

export const ResourceDetail: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { data: resource } = useResource(() => params.id);
  const { data: notes } = useNotes(() => params.id);

  const [showAddNote, setShowAddNote] = createSignal(false);
  const [noteType, setNoteType] = createSignal<string>('general');
  const [noteContent, setNoteContent] = createSignal('');

  // Edit mode state
  const [isEditing, setIsEditing] = createSignal(false);
  const [editTitle, setEditTitle] = createSignal('');
  const [editDescription, setEditDescription] = createSignal('');
  const [editThumbnail, setEditThumbnail] = createSignal('');

  // Note editing state
  const [editingNoteId, setEditingNoteId] = createSignal<string | null>(null);
  const [editNoteContent, setEditNoteContent] = createSignal('');
  const [editNoteType, setEditNoteType] = createSignal<string>('general');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  const plugin = () => resource() ? pluginRegistry.get(resource()!.type) : null;
  const resourceTopicIds = () => {
    if (!resource()) return [];
    return parseTopicIds(resource()!.topicIds);
  };
  
  // Resolve thumbnail URL (handles local thumbnails)
  const thumbnailUrl = useThumbnail(() => resource()?.thumbnail);

  // Initialize edit fields when entering edit mode
  const startEditing = () => {
    if (!resource()) return;
    setEditTitle(resource()!.title);
    setEditDescription(resource()!.description);
    setEditThumbnail(resource()!.thumbnail);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEdits = () => {
    if (!resource()) return;
    updateResource(resource()!.id, {
      title: editTitle(),
      description: editDescription(),
      thumbnail: editThumbnail(),
    });
    setIsEditing(false);
  };

  // Note editing functions
  const startEditingNote = (noteId: string, content: string, type: string) => {
    setEditingNoteId(noteId);
    setEditNoteContent(content);
    setEditNoteType(type);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditNoteContent('');
    setEditNoteType('general');
  };

  const saveNoteEdit = () => {
    const noteId = editingNoteId();
    if (!noteId) return;
    updateNote(noteId, {
      content: editNoteContent(),
      type: editNoteType() as any,
    });
    cancelEditingNote();
  };

  const handleStatusChange = (status: 'to-study' | 'in-progress' | 'completed') => {
    if (!resource()) return;
    updateResourceStatus(resource()!.id, status);
  };

  const handleDelete = () => {
    if (!resource()) return;
    deleteResource(resource()!.id);
    navigate('/resources');
  };

  const handleAddNote = () => {
    if (!resource() || !noteContent().trim()) return;
    createNote({
      resourceId: resource()!.id,
      type: noteType() as any,
      content: noteContent().trim(),
    });
    setNoteContent('');
    setShowAddNote(false);
  };

  const handleTopicsChange = (topicIds: string[]) => {
    if (!resource()) return;
    updateResource(resource()!.id, { topicIds });
  };

  const handleRatingChange = (rating: number) => {
    if (!resource()) return;
    // Toggle off if clicking the same rating
    const newRating = resource()!.rating === rating ? 0 : rating;
    updateResource(resource()!.id, { rating: newRating });
  };

  return (
    <Show when={resource()} fallback={<div class="p-6">Loading...</div>}>
      <div class="p-6 space-y-6">
        {/* Back button */}
        <button
          type="button"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft class="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div class="bg-white border rounded-xl overflow-hidden">
          <Show when={!isEditing()} fallback={
            /* Edit mode */
            <div class="p-6 space-y-4">
              <div class="flex items-center justify-between mb-2">
                <h2 class="text-lg font-semibold text-gray-900">Edit Resource</h2>
                <div class="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEditing}>
                    <X class="w-4 h-4" /> Cancel
                  </Button>
                  <Button size="sm" onClick={saveEdits}>
                    <Check class="w-4 h-4" /> Save
                  </Button>
                </div>
              </div>
              <Input
                label="Title"
                value={editTitle()}
                onInput={(e) => setEditTitle(e.currentTarget.value)}
                placeholder="Resource title"
              />
              <Textarea
                label="Description"
                value={editDescription()}
                onInput={(e) => setEditDescription(e.currentTarget.value)}
                placeholder="Resource description"
                rows={3}
              />
              <ThumbnailInput
                label="Thumbnail"
                value={editThumbnail()}
                onChange={setEditThumbnail}
              />
            </div>
          }>
            {/* View mode */}
            <div class="flex">
              <Show when={thumbnailUrl()}>
                <img
                  src={thumbnailUrl()}
                  alt=""
                  class="w-48 object-contain"
                />
              </Show>
              <div class="flex-1 p-6">
                <div class="flex items-start justify-between">
                  <div>
                    <Show when={plugin()}>
                      {(p) => {
                        const Icon = p().icon;
                        return (
                          <span class="inline-flex items-center gap-1 text-sm font-medium mb-2" style={{ color: p().color }}>
                            <Icon class="w-4 h-4" />
                            {p().name}
                          </span>
                        );
                      }}
                    </Show>
                    <h1 class="text-xl font-bold text-gray-900">{resource()!.title}</h1>
                    <Show when={resource()!.description}>
                      <p class="text-gray-600 mt-2">{resource()!.description}</p>
                    </Show>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      onClick={startEditing}
                      title="Edit resource"
                    >
                      <Pencil class="w-5 h-5" />
                    </button>
                    <Show when={resource()!.url}>
                      <a
                        href={resource()!.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <ExternalLink class="w-5 h-5" />
                      </a>
                    </Show>
                    <button
                      type="button"
                      class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Status buttons */}
                <div class="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant={resource()?.status === 'to-study' ? 'primary' : 'ghost'}
                    onClick={() => handleStatusChange('to-study')}
                  >
                    <Clock class="w-4 h-4" /> To Study
                  </Button>
                  <Button
                    size="sm"
                    variant={resource()?.status === 'in-progress' ? 'primary' : 'ghost'}
                    onClick={() => handleStatusChange('in-progress')}
                  >
                    <BookOpen class="w-4 h-4" /> In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={resource()?.status === 'completed' ? 'primary' : 'ghost'}
                    onClick={() => handleStatusChange('completed')}
                  >
                    <CircleCheck class="w-4 h-4" /> Completed
                  </Button>
                </div>
              </div>
            </div>
          </Show>
        </div>

        {/* Rating */}
        <div class="bg-white border rounded-xl p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Rating</h2>
            <div class="flex items-center gap-1">
              <For each={[1, 2, 3, 4, 5]}>
                {(star) => (
                  <button
                    type="button"
                    class="p-1 transition-transform hover:scale-110"
                    onClick={() => handleRatingChange(star)}
                    title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      class={`w-6 h-6 ${
                        star <= (resource()?.rating || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                )}
              </For>
              <Show when={resource()?.rating}>
                <span class="ml-2 text-sm text-gray-500">
                  {resource()!.rating}/5
                </span>
              </Show>
            </div>
          </div>
        </div>

        {/* Topics */}
        <div class="bg-white border rounded-xl p-6">
          <TopicSelector
            selected={resourceTopicIds()}
            onChange={handleTopicsChange}
          />
        </div>

        {/* Notes */}
        <div class="bg-white border rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Notes</h2>
            <Button size="sm" onClick={() => setShowAddNote(true)}>
              <Plus class="w-4 h-4" /> Add Note
            </Button>
          </div>

          {/* Add note form */}
          <Show when={showAddNote()}>
            <div class="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div class="flex flex-wrap gap-2">
                <For each={noteTypes}>
                  {(type) => (
                    <button
                      type="button"
                      class={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        noteType() === type.id
                          ? 'text-white'
                          : 'bg-white border text-gray-700 hover:bg-gray-100'
                      }`}
                      style={noteType() === type.id ? { 'background-color': type.color } : {}}
                      onClick={() => setNoteType(type.id)}
                    >
                      <type.icon class="w-3 h-3" />
                      {type.label}
                    </button>
                  )}
                </For>
              </div>
              <Textarea
                placeholder="Write your note..."
                value={noteContent()}
                onInput={(e) => setNoteContent(e.currentTarget.value)}
                rows={3}
              />
              <div class="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowAddNote(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddNote}>Save Note</Button>
              </div>
            </div>
          </Show>

          {/* Notes list */}
          <Show
            when={notes() && notes()!.length > 0}
            fallback={
              <p class="text-gray-500 text-center py-8">No notes yet. Add your first note!</p>
            }
          >
            <div class="space-y-3">
              <For each={notes()}>
                {(note) => {
                  const type = noteTypes.find(t => t.id === note.type) || noteTypes[5];
                  return (
                    <Show when={editingNoteId() === note.id} fallback={
                      /* View mode for note */
                      <div class="p-4 border rounded-lg">
                        <div class="flex items-start justify-between">
                          <span
                            class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ 'background-color': `${type.color}20`, color: type.color }}
                          >
                            <type.icon class="w-3 h-3" />
                            {type.label}
                          </span>
                          <div class="flex items-center gap-1">
                            <button
                              type="button"
                              class="text-gray-400 hover:text-blue-500"
                              onClick={() => startEditingNote(note.id, note.content, note.type)}
                              title="Edit note"
                            >
                              <Pencil class="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              class="text-gray-400 hover:text-red-500"
                              onClick={() => deleteNote(note.id)}
                            >
                              <Trash2 class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p class="mt-2 text-gray-700 whitespace-pre-wrap">{note.content}</p>
                        <p class="mt-2 text-xs text-gray-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    }>
                      {/* Edit mode for note */}
                      <div class="p-4 border-2 border-blue-300 rounded-lg bg-blue-50 space-y-3">
                        <div class="flex flex-wrap gap-2">
                          <For each={noteTypes}>
                            {(t) => (
                              <button
                                type="button"
                                class={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                                  editNoteType() === t.id
                                    ? 'text-white'
                                    : 'bg-white border text-gray-700 hover:bg-gray-100'
                                }`}
                                style={editNoteType() === t.id ? { 'background-color': t.color } : {}}
                                onClick={() => setEditNoteType(t.id)}
                              >
                                <t.icon class="w-3 h-3" />
                                {t.label}
                              </button>
                            )}
                          </For>
                        </div>
                        <Textarea
                          value={editNoteContent()}
                          onInput={(e) => setEditNoteContent(e.currentTarget.value)}
                          rows={3}
                        />
                        <div class="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={cancelEditingNote}>
                            <X class="w-4 h-4" /> Cancel
                          </Button>
                          <Button size="sm" onClick={saveNoteEdit}>
                            <Check class="w-4 h-4" /> Save
                          </Button>
                        </div>
                      </div>
                    </Show>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm()}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Resource"
        message="Are you sure you want to delete this resource and all its notes? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Show>
  );
};

export default ResourceDetail;
