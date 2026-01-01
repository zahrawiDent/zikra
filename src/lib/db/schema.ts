// TinyBase store schema and initialization
import { createStore, Store } from 'tinybase';
import { createIndexedDbPersister, IndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';

// ============ TYPE DEFINITIONS ============

/**
 * Category represents a high-level dental specialty or domain
 * Examples: Operative, Endodontics, Prosthodontics, Periodontics
 */
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string; // emoji or icon name
  order: number; // for custom sorting
  createdAt: string;
}

/**
 * Topic belongs to a Category and represents a specific subject
 * Examples: Operative > Composite, Caries; Endodontics > Working Length, Shaping
 */
export interface Topic {
  id: string;
  name: string;
  categoryId: string; // parent category
  color: string; // inherits from category if not set
  createdAt: string;
}

/**
 * CategoryTopicMapping stores which topics under which categories a resource belongs to
 * This allows a resource to belong to multiple categories, each with different topics
 * Example: A video might be tagged as:
 *   - Operative: [composite, adhesion]
 *   - Endodontics: [access-cavity]
 */
export interface CategoryTopicMap {
  [categoryId: string]: string[]; // categoryId -> topicIds[]
}

export interface Resource {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  metadata: string; // JSON stringified
  categoryTopics: string; // JSON stringified CategoryTopicMap
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
    categoryTopics: (row.categoryTopics as string) || '{}',
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

export function rowToCategory(rowId: string, row: Record<string, unknown>): Category {
  return {
    id: rowId,
    name: (row.name as string) || '',
    color: (row.color as string) || '#3b82f6',
    icon: (row.icon as string) || '📁',
    order: (row.order as number) || 0,
    createdAt: (row.createdAt as string) || '',
  };
}

export function rowToTopic(rowId: string, row: Record<string, unknown>): Topic {
  return {
    id: rowId,
    name: (row.name as string) || '',
    categoryId: (row.categoryId as string) || '',
    color: (row.color as string) || '#3b82f6',
    createdAt: (row.createdAt as string) || '',
  };
}

// ============ JSON PARSING HELPERS ============

/**
 * Parse categoryTopics JSON to CategoryTopicMap
 */
export function parseCategoryTopics(json: string): CategoryTopicMap {
  try {
    return JSON.parse(json) || {};
  } catch {
    return {};
  }
}

/**
 * Get all topic IDs from a CategoryTopicMap (flattened)
 */
export function getAllTopicIds(categoryTopics: CategoryTopicMap): string[] {
  return Object.values(categoryTopics).flat();
}

/**
 * Get all category IDs from a CategoryTopicMap
 */
export function getCategoryIds(categoryTopics: CategoryTopicMap): string[] {
  return Object.keys(categoryTopics);
}

/**
 * Check if resource belongs to a specific category
 */
export function hasCategory(categoryTopics: CategoryTopicMap, categoryId: string): boolean {
  return categoryId in categoryTopics;
}

/**
 * Check if resource has a specific topic
 */
export function hasTopic(categoryTopics: CategoryTopicMap, topicId: string): boolean {
  return Object.values(categoryTopics).some(topics => topics.includes(topicId));
}

/**
 * Check if resource has a specific topic under a specific category
 */
export function hasTopicInCategory(categoryTopics: CategoryTopicMap, categoryId: string, topicId: string): boolean {
  return categoryTopics[categoryId]?.includes(topicId) || false;
}

export function parseMetadata(metadataJson: string): Record<string, unknown> {
  try {
    return JSON.parse(metadataJson) || {};
  } catch {
    return {};
  }
}
