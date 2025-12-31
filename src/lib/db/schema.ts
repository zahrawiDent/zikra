// TinyBase store schema and initialization
import { createStore, Store } from 'tinybase';
import { createIndexedDbPersister, IndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';

// ============ TYPE DEFINITIONS ============

export interface Resource {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  metadata: string; // JSON stringified
  topicIds: string; // JSON stringified array
  status: 'to-study' | 'in-progress' | 'completed';
  progress: number;
  rating: number; // 0-5 stars (0 = unrated)
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  resourceId: string;
  type: 'summary' | 'pearl' | 'question' | 'disagreement' | 'action' | 'general';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  color: string;
  parentId: string;
  createdAt: string;
}

// ============ STORE CREATION ============

export const store: Store = createStore();

// ============ PERSISTER ============

let persister: IndexedDbPersister | null = null;

export async function initializeStore(): Promise<void> {
  persister = createIndexedDbPersister(store, 'DentistryStudyHub');
  
  // Load existing data from IndexedDB
  await persister.load();
  
  // Start auto-saving changes
  await persister.startAutoSave();
}

export function getStore(): Store {
  return store;
}

// ============ HELPER FUNCTIONS ============

export function rowToResource(rowId: string, row: Record<string, unknown>): Resource {
  return {
    id: rowId,
    type: (row.type as string) || '',
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    url: (row.url as string) || '',
    thumbnail: (row.thumbnail as string) || '',
    metadata: (row.metadata as string) || '{}',
    topicIds: (row.topicIds as string) || '[]',
    status: (row.status as Resource['status']) || 'to-study',
    progress: (row.progress as number) || 0,
    rating: (row.rating as number) || 0,
    createdAt: (row.createdAt as string) || '',
    updatedAt: (row.updatedAt as string) || '',
  };
}

export function rowToNote(rowId: string, row: Record<string, unknown>): Note {
  return {
    id: rowId,
    resourceId: (row.resourceId as string) || '',
    type: (row.type as Note['type']) || 'general',
    content: (row.content as string) || '',
    createdAt: (row.createdAt as string) || '',
    updatedAt: (row.updatedAt as string) || '',
  };
}

export function rowToTopic(rowId: string, row: Record<string, unknown>): Topic {
  return {
    id: rowId,
    name: (row.name as string) || '',
    color: (row.color as string) || '#3b82f6',
    parentId: (row.parentId as string) || '',
    createdAt: (row.createdAt as string) || '',
  };
}

// Parse JSON fields safely
export function parseTopicIds(topicIdsJson: string): string[] {
  try {
    return JSON.parse(topicIdsJson) || [];
  } catch {
    return [];
  }
}

export function parseMetadata(metadataJson: string): Record<string, unknown> {
  try {
    return JSON.parse(metadataJson) || {};
  } catch {
    return {};
  }
}
