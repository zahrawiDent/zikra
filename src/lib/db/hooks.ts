// Reactive TinyBase hooks for SolidJS
import { createSignal, createEffect, onCleanup, Accessor, createMemo, on } from 'solid-js';
import { 
  store, rowToResource, rowToNote, rowToTopic, rowToCategory, 
  parseCategoryTopics, hasCategory, hasTopic, 
  Resource, Note, Topic, Category, CategoryTopicMap 
} from './schema';
import { getThumbnailUrl, isLocalThumbnail } from './thumbnails';

// ============ GENERIC HOOKS ============

function useTable<T>(
  tableId: string,
  rowMapper: (rowId: string, row: Record<string, unknown>) => T
): Accessor<T[]> {
  const [data, setData] = createSignal<T[]>([]);

  const updateData = () => {
    const table = store.getTable(tableId);
    const items = Object.entries(table || {}).map(([rowId, row]) =>
      rowMapper(rowId, row as Record<string, unknown>)
    );
    setData(items);
  };

  // Initial load and subscribe within an effect to ensure proper reactive context
  createEffect(() => {
    updateData();
    const listenerId = store.addTableListener(tableId, updateData);
    onCleanup(() => store.delListener(listenerId));
  });

  return data;
}

function useRow<T>(
  tableId: string,
  rowId: Accessor<string | undefined>,
  rowMapper: (rowId: string, row: Record<string, unknown>) => T
): Accessor<T | undefined> {
  const [data, setData] = createSignal<T | undefined>(undefined);

  createEffect(() => {
    const id = rowId();
    if (!id) {
      setData(() => undefined);
      return;
    }

    const updateData = () => {
      const row = store.getRow(tableId, id);
      if (row && Object.keys(row).length > 0) {
        const mapped = rowMapper(id, row as Record<string, unknown>);
        setData(() => mapped);
      } else {
        setData(() => undefined);
      }
    };

    updateData();
    // Use addCellListener with null for cellId to listen to all cell changes in the row
    const listenerId = store.addCellListener(tableId, id, null, updateData);
    onCleanup(() => store.delListener(listenerId));
  });

  return data;
}

// ============ RESOURCE HOOKS ============

export interface ResourceFilters {
  type?: string;
  status?: string;
  categoryId?: string;
  topicId?: string;
  search?: string;
}

export function useResources(filtersAccessor?: Accessor<ResourceFilters>): { 
  data: Accessor<Resource[]>; 
  loading: Accessor<boolean> 
} {
  const allResources = useTable('resources', rowToResource);

  const filteredResources = createMemo(() => {
    let results = allResources();
    
    // Get filters from accessor if provided
    const f = filtersAccessor?.();
    
    if (f?.type) {
      results = results.filter(r => r.type === f.type);
    }

    if (f?.status) {
      results = results.filter(r => r.status === f.status);
    }

    if (f?.categoryId) {
      results = results.filter(r => {
        const categoryTopics = parseCategoryTopics(r.categoryTopics);
        return hasCategory(categoryTopics, f.categoryId!);
      });
    }

    if (f?.topicId) {
      results = results.filter(r => {
        const categoryTopics = parseCategoryTopics(r.categoryTopics);
        return hasTopic(categoryTopics, f.topicId!);
      });
    }

    if (f?.search) {
      const search = f.search.toLowerCase();
      results = results.filter(r =>
        r.title.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search)
      );
    }

    // Sort by createdAt descending
    return results.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  return { 
    data: filteredResources, 
    loading: () => false 
  };
}

export function useResource(id: Accessor<string | undefined>): {
  data: Accessor<Resource | undefined>;
  loading: Accessor<boolean>;
} {
  const data = useRow('resources', id, rowToResource);
  return { data, loading: () => false };
}

// ============ NOTE HOOKS ============

export function useNotes(resourceId: Accessor<string | undefined>): {
  data: Accessor<Note[]>;
  loading: Accessor<boolean>;
} {
  const allNotes = useTable('notes', rowToNote);

  const filteredNotes = createMemo(() => {
    const id = resourceId();
    if (!id) return [];
    
    return allNotes()
      .filter(n => n.resourceId === id)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  });

  return { data: filteredNotes, loading: () => false };
}

// ============ CATEGORY HOOKS ============

export function useCategories(): {
  data: Accessor<Category[]>;
  loading: Accessor<boolean>;
} {
  const categories = useTable('categories', rowToCategory);

  const sortedCategories = createMemo(() => {
    return [...categories()].sort((a, b) => a.order - b.order);
  });

  return { data: sortedCategories, loading: () => false };
}

export function useCategory(id: Accessor<string | undefined>): {
  data: Accessor<Category | undefined>;
  loading: Accessor<boolean>;
} {
  const data = useRow('categories', id, rowToCategory);
  return { data, loading: () => false };
}

// ============ TOPIC HOOKS ============

export function useTopics(categoryIdAccessor?: Accessor<string | undefined>): {
  data: Accessor<Topic[]>;
  loading: Accessor<boolean>;
} {
  const allTopics = useTable('topics', rowToTopic);

  const filteredTopics = createMemo(() => {
    let topics = [...allTopics()];
    
    const categoryId = categoryIdAccessor?.();
    if (categoryId) {
      topics = topics.filter(t => t.categoryId === categoryId);
    }
    
    return topics.sort((a, b) => a.name.localeCompare(b.name));
  });

  return { data: filteredTopics, loading: () => false };
}

export function useTopic(id: Accessor<string | undefined>): {
  data: Accessor<Topic | undefined>;
  loading: Accessor<boolean>;
} {
  const data = useRow('topics', id, rowToTopic);
  return { data, loading: () => false };
}

/**
 * Get topics grouped by category
 */
export function useTopicsByCategory(): Accessor<Map<string, Topic[]>> {
  const { data: allTopics } = useTopics();
  
  return createMemo(() => {
    const map = new Map<string, Topic[]>();
    for (const topic of allTopics()) {
      const existing = map.get(topic.categoryId) || [];
      existing.push(topic);
      map.set(topic.categoryId, existing);
    }
    return map;
  });
}

/**
 * Get resource counts by category and topic
 */
export function useCategoryTopicCounts(): Accessor<{
  byCategory: Map<string, number>;
  byTopic: Map<string, number>;
}> {
  const allResources = useTable('resources', rowToResource);
  
  return createMemo(() => {
    const byCategory = new Map<string, number>();
    const byTopic = new Map<string, number>();
    
    for (const resource of allResources()) {
      const categoryTopics = parseCategoryTopics(resource.categoryTopics);
      
      for (const [categoryId, topicIds] of Object.entries(categoryTopics)) {
        // Count category
        byCategory.set(categoryId, (byCategory.get(categoryId) || 0) + 1);
        
        // Count topics
        for (const topicId of topicIds) {
          byTopic.set(topicId, (byTopic.get(topicId) || 0) + 1);
        }
      }
    }
    
    return { byCategory, byTopic };
  });
}

// ============ STATS HOOK ============

export function useStats(): {
  data: Accessor<{
    resources: number;
    notes: number;
    categories: number;
    topics: number;
    byStatus: {
      'to-study': number;
      'in-progress': number;
      'completed': number;
    };
  }>;
  loading: Accessor<boolean>;
} {
  const resources = useTable('resources', rowToResource);
  const notes = useTable('notes', rowToNote);
  const categories = useTable('categories', rowToCategory);
  const topics = useTable('topics', rowToTopic);

  const stats = createMemo(() => ({
    resources: resources().length,
    notes: notes().length,
    categories: categories().length,
    topics: topics().length,
    byStatus: {
      'to-study': resources().filter(r => r.status === 'to-study').length,
      'in-progress': resources().filter(r => r.status === 'in-progress').length,
      'completed': resources().filter(r => r.status === 'completed').length,
    },
  }));

  return { data: stats, loading: () => false };
}

// ============ THUMBNAIL HOOK ============

// Cache for resolved blob URLs to avoid recreating them
const thumbnailCache = new Map<string, string>();

export function useThumbnail(thumbnailUrl: Accessor<string | undefined>): Accessor<string | undefined> {
  const [resolvedUrl, setResolvedUrl] = createSignal<string | undefined>(undefined);

  createEffect(() => {
    const url = thumbnailUrl();
    if (!url) {
      setResolvedUrl(undefined);
      return;
    }

    // If it's not a local thumbnail, return as-is
    if (!isLocalThumbnail(url)) {
      setResolvedUrl(url);
      return;
    }

    // Check cache first
    const cached = thumbnailCache.get(url);
    if (cached) {
      setResolvedUrl(cached);
      return;
    }

    // Resolve local thumbnail
    getThumbnailUrl(url).then((resolved) => {
      if (resolved) {
        thumbnailCache.set(url, resolved);
        setResolvedUrl(resolved);
      } else {
        setResolvedUrl(undefined);
      }
    }).catch(() => {
      setResolvedUrl(undefined);
    });
  });

  return resolvedUrl;
}
