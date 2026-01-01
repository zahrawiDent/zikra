// Database CRUD actions using TinyBase
import { v4 as uuid } from 'uuid';
import { store, Resource, Note, Topic, Category, CategoryTopicMap, parseCategoryTopics } from './schema';

// ============ RESOURCE ACTIONS ============

export interface CreateResourceData {
  type: string;
  title: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
  categoryTopics?: CategoryTopicMap;
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
    categoryTopics: JSON.stringify(data.categoryTopics || {}),
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
  if (data.categoryTopics !== undefined) updates.categoryTopics = JSON.stringify(data.categoryTopics);
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

/**
 * Add a topic to a resource under a specific category
 */
export function addTopicToResource(resourceId: string, categoryId: string, topicId: string): void {
  const row = store.getRow('resources', resourceId);
  if (!row) return;

  const categoryTopics = parseCategoryTopics((row.categoryTopics as string) || '{}');
  if (!categoryTopics[categoryId]) {
    categoryTopics[categoryId] = [];
  }
  if (!categoryTopics[categoryId].includes(topicId)) {
    categoryTopics[categoryId].push(topicId);
    store.setPartialRow('resources', resourceId, {
      categoryTopics: JSON.stringify(categoryTopics),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Remove a topic from a resource under a specific category
 */
export function removeTopicFromResource(resourceId: string, categoryId: string, topicId: string): void {
  const row = store.getRow('resources', resourceId);
  if (!row) return;

  const categoryTopics = parseCategoryTopics((row.categoryTopics as string) || '{}');
  if (categoryTopics[categoryId]) {
    categoryTopics[categoryId] = categoryTopics[categoryId].filter(id => id !== topicId);
    // Remove category if no topics left
    if (categoryTopics[categoryId].length === 0) {
      delete categoryTopics[categoryId];
    }
    store.setPartialRow('resources', resourceId, {
      categoryTopics: JSON.stringify(categoryTopics),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Add a category to a resource (without any topics)
 */
export function addCategoryToResource(resourceId: string, categoryId: string): void {
  const row = store.getRow('resources', resourceId);
  if (!row) return;

  const categoryTopics = parseCategoryTopics((row.categoryTopics as string) || '{}');
  if (!categoryTopics[categoryId]) {
    categoryTopics[categoryId] = [];
    store.setPartialRow('resources', resourceId, {
      categoryTopics: JSON.stringify(categoryTopics),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Remove a category (and all its topics) from a resource
 */
export function removeCategoryFromResource(resourceId: string, categoryId: string): void {
  const row = store.getRow('resources', resourceId);
  if (!row) return;

  const categoryTopics = parseCategoryTopics((row.categoryTopics as string) || '{}');
  if (categoryTopics[categoryId]) {
    delete categoryTopics[categoryId];
    store.setPartialRow('resources', resourceId, {
      categoryTopics: JSON.stringify(categoryTopics),
      updatedAt: new Date().toISOString(),
    });
  }
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

// ============ CATEGORY ACTIONS ============

export interface CreateCategoryData {
  name: string;
  color: string;
  icon?: string;
  order?: number;
}

export function createCategory(data: CreateCategoryData): Category {
  const id = uuid();
  const now = new Date().toISOString();

  // Get max order for new categories
  const categoriesTable = store.getTable('categories') || {};
  const maxOrder = Object.values(categoriesTable).reduce((max, cat) => {
    const order = (cat as Record<string, unknown>).order as number || 0;
    return Math.max(max, order);
  }, -1);

  const category: Category = {
    id,
    name: data.name,
    color: data.color,
    icon: data.icon || '📁',
    order: data.order ?? maxOrder + 1,
    createdAt: now,
  };

  store.setRow('categories', id, category as unknown as Record<string, string | number | boolean>);
  return category;
}

export function updateCategory(
  id: string,
  data: Partial<Pick<Category, 'name' | 'color' | 'icon' | 'order'>>
): void {
  const existing = store.getRow('categories', id);
  if (!existing) return;

  const updates: Record<string, string | number> = {};

  if (data.name !== undefined) updates.name = data.name;
  if (data.color !== undefined) updates.color = data.color;
  if (data.icon !== undefined) updates.icon = data.icon;
  if (data.order !== undefined) updates.order = data.order;

  if (Object.keys(updates).length > 0) {
    store.setPartialRow('categories', id, updates);
  }
}

export function deleteCategory(id: string): void {
  // First, delete all topics that belong to this category
  const topicsTable = store.getTable('topics') || {};
  const topicsToDelete: string[] = [];
  Object.entries(topicsTable).forEach(([topicId, topic]) => {
    if ((topic as Record<string, unknown>).categoryId === id) {
      topicsToDelete.push(topicId);
    }
  });
  
  // Delete topics
  topicsToDelete.forEach(topicId => {
    store.delRow('topics', topicId);
  });

  // Remove category from all resources
  const resourcesTable = store.getTable('resources') || {};
  Object.entries(resourcesTable).forEach(([resourceId, resource]) => {
    const categoryTopics = parseCategoryTopics((resource as Record<string, unknown>).categoryTopics as string || '{}');
    if (categoryTopics[id]) {
      delete categoryTopics[id];
      store.setCell('resources', resourceId, 'categoryTopics', JSON.stringify(categoryTopics));
    }
  });

  store.delRow('categories', id);
}

// ============ TOPIC ACTIONS ============

export interface CreateTopicData {
  name: string;
  categoryId: string;
  color?: string;
}

export function createTopic(data: CreateTopicData): Topic {
  const id = uuid();
  const now = new Date().toISOString();

  // If no color provided, inherit from category
  let color = data.color;
  if (!color) {
    const category = store.getRow('categories', data.categoryId);
    color = (category?.color as string) || '#3b82f6';
  }

  const topic: Topic = {
    id,
    name: data.name,
    categoryId: data.categoryId,
    color,
    createdAt: now,
  };

  store.setRow('topics', id, topic as unknown as Record<string, string | number | boolean>);
  return topic;
}

export function updateTopic(
  id: string,
  data: Partial<Pick<Topic, 'name' | 'color' | 'categoryId'>>
): void {
  const existing = store.getRow('topics', id);
  if (!existing) return;

  const updates: Record<string, string> = {};

  if (data.name !== undefined) updates.name = data.name;
  if (data.color !== undefined) updates.color = data.color;
  if (data.categoryId !== undefined) updates.categoryId = data.categoryId;

  if (Object.keys(updates).length > 0) {
    store.setPartialRow('topics', id, updates);
  }
}

export function deleteTopic(id: string): void {
  // Get the topic to find its category
  const topic = store.getRow('topics', id);
  const categoryId = topic?.categoryId as string;

  // Remove topic from all resources
  const resourcesTable = store.getTable('resources') || {};
  Object.entries(resourcesTable).forEach(([resourceId, resource]) => {
    const categoryTopics = parseCategoryTopics((resource as Record<string, unknown>).categoryTopics as string || '{}');
    
    // Check all categories for this topic
    let modified = false;
    Object.keys(categoryTopics).forEach(catId => {
      if (categoryTopics[catId].includes(id)) {
        categoryTopics[catId] = categoryTopics[catId].filter(tid => tid !== id);
        if (categoryTopics[catId].length === 0) {
          delete categoryTopics[catId];
        }
        modified = true;
      }
    });
    
    if (modified) {
      store.setCell('resources', resourceId, 'categoryTopics', JSON.stringify(categoryTopics));
    }
  });

  store.delRow('topics', id);
}

// ============ SEED DATA ============

export function seedDefaultCategories(): void {
  const categoriesTable = store.getTable('categories') || {};
  if (Object.keys(categoriesTable).length > 0) return;

  const defaultCategories: Array<{ name: string; color: string; icon: string; topics: string[] }> = [
    { 
      name: 'Operative', 
      color: '#3b82f6', 
      icon: '🦷',
      topics: ['Composite', 'Amalgam', 'Caries', 'Adhesion', 'Cavity Preparation']
    },
    { 
      name: 'Endodontics', 
      color: '#ef4444', 
      icon: '🔬',
      topics: ['Working Length', 'Shaping', 'Obturation', 'Irrigation', 'Access Cavity']
    },
    { 
      name: 'Prosthodontics', 
      color: '#f97316', 
      icon: '👑',
      topics: ['Fixed Prosthesis', 'Removable Prosthesis', 'Implants', 'Occlusion', 'Impressions']
    },
    { 
      name: 'Periodontics', 
      color: '#22c55e', 
      icon: '🩺',
      topics: ['Scaling', 'Root Planing', 'Flap Surgery', 'Regeneration', 'Maintenance']
    },
    { 
      name: 'Oral Surgery', 
      color: '#8b5cf6', 
      icon: '⚕️',
      topics: ['Extractions', 'Impactions', 'Suturing', 'Local Anesthesia', 'Complications']
    },
    { 
      name: 'Orthodontics', 
      color: '#06b6d4', 
      icon: '📐',
      topics: ['Brackets', 'Aligners', 'Retention', 'Space Management', 'Growth Modification']
    },
    { 
      name: 'Pediatric Dentistry', 
      color: '#ec4899', 
      icon: '👶',
      topics: ['Behavior Management', 'Pulp Therapy', 'Space Maintainers', 'Prevention']
    },
    { 
      name: 'Oral Pathology', 
      color: '#eab308', 
      icon: '🔍',
      topics: ['Lesions', 'Cysts', 'Tumors', 'Infections', 'Differential Diagnosis']
    },
  ];

  for (let i = 0; i < defaultCategories.length; i++) {
    const catData = defaultCategories[i];
    const category = createCategory({ 
      name: catData.name, 
      color: catData.color, 
      icon: catData.icon,
      order: i 
    });
    
    // Create topics for this category
    for (const topicName of catData.topics) {
      createTopic({ 
        name: topicName, 
        categoryId: category.id,
        color: catData.color 
      });
    }
  }
}
