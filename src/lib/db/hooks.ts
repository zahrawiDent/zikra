// Reactive TinyBase hooks for SolidJS
import { createSignal, createEffect, onCleanup, Accessor, createMemo, on } from 'solid-js';
import { store, rowToResource, rowToNote, rowToTopic, parseTopicIds, Resource, Note, Topic } from './schema';

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

    if (f?.topicId) {
      results = results.filter(r => parseTopicIds(r.topicIds).includes(f.topicId!));
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

// ============ TOPIC HOOKS ============

export function useTopics(): {
  data: Accessor<Topic[]>;
  loading: Accessor<boolean>;
} {
  const topics = useTable('topics', rowToTopic);

  const sortedTopics = createMemo(() => {
    return [...topics()].sort((a, b) => a.name.localeCompare(b.name));
  });

  return { data: sortedTopics, loading: () => false };
}

export function useTopic(id: Accessor<string | undefined>): {
  data: Accessor<Topic | undefined>;
  loading: Accessor<boolean>;
} {
  const data = useRow('topics', id, rowToTopic);
  return { data, loading: () => false };
}

// ============ STATS HOOK ============

export function useStats(): {
  data: Accessor<{
    resources: number;
    notes: number;
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
  const topics = useTable('topics', rowToTopic);

  const stats = createMemo(() => ({
    resources: resources().length,
    notes: notes().length,
    topics: topics().length,
    byStatus: {
      'to-study': resources().filter(r => r.status === 'to-study').length,
      'in-progress': resources().filter(r => r.status === 'in-progress').length,
      'completed': resources().filter(r => r.status === 'completed').length,
    },
  }));

  return { data: stats, loading: () => false };
}
