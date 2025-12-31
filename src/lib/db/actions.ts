// Database CRUD actions using TinyBase
import { v4 as uuid } from 'uuid';
import { store, Resource, Note, Topic, parseTopicIds } from './schema';

// ============ RESOURCE ACTIONS ============

export interface CreateResourceData {
  type: string;
  title: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
  topicIds?: string[];
  status?: Resource['status'];
  progress?: number;
  rating?: number;
}

export function createResource(data: CreateResourceData): Resource {
  const id = uuid();
  const now = new Date().toISOString();

  const resource: Resource = {
    id,
    type: data.type,
    title: data.title,
    description: data.description || '',
    url: data.url || '',
    thumbnail: data.thumbnail || '',
    metadata: JSON.stringify(data.metadata || {}),
    topicIds: JSON.stringify(data.topicIds || []),
    status: data.status || 'to-study',
    progress: data.progress || 0,
    rating: data.rating || 0,
    createdAt: now,
    updatedAt: now,
  };

  store.setRow('resources', id, resource as unknown as Record<string, string | number | boolean>);
  return resource;
}

export function updateResource(
  id: string,
  data: Partial<Omit<CreateResourceData, 'type'>>
): void {
  const existing = store.getRow('resources', id);
  if (!existing) return;

  const updates: Record<string, string | number | boolean> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.url !== undefined) updates.url = data.url;
  if (data.thumbnail !== undefined) updates.thumbnail = data.thumbnail;
  if (data.metadata !== undefined) updates.metadata = JSON.stringify(data.metadata);
  if (data.topicIds !== undefined) updates.topicIds = JSON.stringify(data.topicIds);
  if (data.status !== undefined) updates.status = data.status;
  if (data.progress !== undefined) updates.progress = data.progress;
  if (data.rating !== undefined) updates.rating = data.rating;

  // Update all cells at once using setPartialRow for better performance
  store.setPartialRow('resources', id, updates);
}

export function deleteResource(id: string): void {
  // Delete associated notes first
  const notesTable = store.getTable('notes') || {};
  Object.entries(notesTable).forEach(([noteId, note]) => {
    if ((note as Record<string, unknown>).resourceId === id) {
      store.delRow('notes', noteId);
    }
  });

  store.delRow('resources', id);
}

export function updateResourceStatus(
  id: string,
  status: Resource['status'],
  progress?: number
): void {
  updateResource(id, { status, progress });
}

export function addTopicToResource(resourceId: string, topicId: string): void {
  const row = store.getRow('resources', resourceId);
  if (!row) return;

  const topicIds = parseTopicIds((row.topicIds as string) || '[]');
  if (!topicIds.includes(topicId)) {
    topicIds.push(topicId);
    store.setPartialRow('resources', resourceId, {
      topicIds: JSON.stringify(topicIds),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function removeTopicFromResource(resourceId: string, topicId: string): void {
  const row = store.getRow('resources', resourceId);
  if (!row) return;

  const topicIds = parseTopicIds((row.topicIds as string) || '[]');
  const filtered = topicIds.filter(id => id !== topicId);
  store.setPartialRow('resources', resourceId, {
    topicIds: JSON.stringify(filtered),
    updatedAt: new Date().toISOString(),
  });
}

// ============ NOTE ACTIONS ============

export interface CreateNoteData {
  resourceId: string;
  type: Note['type'];
  content: string;
}

export function createNote(data: CreateNoteData): Note {
  const id = uuid();
  const now = new Date().toISOString();

  const note: Note = {
    id,
    resourceId: data.resourceId,
    type: data.type,
    content: data.content,
    createdAt: now,
    updatedAt: now,
  };

  store.setRow('notes', id, note as unknown as Record<string, string | number | boolean>);
  return note;
}

export function updateNote(
  id: string,
  data: Partial<Pick<Note, 'type' | 'content'>>
): void {
  const existing = store.getRow('notes', id);
  if (!existing) return;

  const updates: Record<string, string> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.type !== undefined) updates.type = data.type;
  if (data.content !== undefined) updates.content = data.content;

  store.setPartialRow('notes', id, updates);
}

export function deleteNote(id: string): void {
  store.delRow('notes', id);
}

// ============ TOPIC ACTIONS ============

export interface CreateTopicData {
  name: string;
  color: string;
  parentId?: string;
}

export function createTopic(data: CreateTopicData): Topic {
  const id = uuid();
  const now = new Date().toISOString();

  const topic: Topic = {
    id,
    name: data.name,
    color: data.color,
    parentId: data.parentId || '',
    createdAt: now,
  };

  store.setRow('topics', id, topic as unknown as Record<string, string | number | boolean>);
  return topic;
}

export function updateTopic(
  id: string,
  data: Partial<Pick<Topic, 'name' | 'color' | 'parentId'>>
): void {
  const existing = store.getRow('topics', id);
  if (!existing) return;

  const updates: Record<string, string> = {};

  if (data.name !== undefined) updates.name = data.name;
  if (data.color !== undefined) updates.color = data.color;
  if (data.parentId !== undefined) updates.parentId = data.parentId;

  if (Object.keys(updates).length > 0) {
    store.setPartialRow('topics', id, updates);
  }
}

export function deleteTopic(id: string): void {
  // Remove topic from all resources first
  const resourcesTable = store.getTable('resources') || {};
  Object.entries(resourcesTable).forEach(([resourceId, resource]) => {
    const topicIds = parseTopicIds((resource as Record<string, unknown>).topicIds as string || '[]');
    if (topicIds.includes(id)) {
      const filtered = topicIds.filter(tid => tid !== id);
      store.setCell('resources', resourceId, 'topicIds', JSON.stringify(filtered));
    }
  });

  store.delRow('topics', id);
}

// ============ SEED DATA ============

export function seedDefaultTopics(): void {
  const topicsTable = store.getTable('topics') || {};
  if (Object.keys(topicsTable).length > 0) return;

  const defaultTopics = [
    { name: 'Endodontics', color: '#ef4444' },
    { name: 'Prosthodontics', color: '#f97316' },
    { name: 'Periodontics', color: '#eab308' },
    { name: 'Oral Surgery', color: '#22c55e' },
    { name: 'Orthodontics', color: '#06b6d4' },
    { name: 'Restorative', color: '#3b82f6' },
    { name: 'Pediatric Dentistry', color: '#8b5cf6' },
    { name: 'Oral Pathology', color: '#ec4899' },
    { name: 'Dental Materials', color: '#6366f1' },
    { name: 'Anatomy', color: '#14b8a6' },
  ];

  for (const topic of defaultTopics) {
    createTopic(topic);
  }
}
