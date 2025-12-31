// Plugin system types
import type { Component } from 'solid-js';

// Result from fetching resource data
export interface FetchedResourceData {
  title: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  metadata: Record<string, unknown>;
}

// Search result for plugins that support searching (like books)
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  metadata: Record<string, unknown>;
}

// Plugin definition
export interface ResourcePlugin {
  // Unique identifier
  id: string;
  
  // Display name
  name: string;
  
  // Icon component
  icon: Component<{ class?: string }>;
  
  // Color for UI
  color: string;
  
  // Input type: 'url' for link-based, 'search' for search-based
  inputType: 'url' | 'search';
  
  // Placeholder text for input
  placeholder: string;
  
  // Validate if input is valid for this plugin
  validate: (input: string) => boolean;
  
  // Fetch data from URL (for url-based plugins)
  fetchFromUrl?: (url: string) => Promise<FetchedResourceData>;
  
  // Search for resources (for search-based plugins)
  search?: (query: string) => Promise<SearchResult[]>;
  
  // Get full details from search result
  getDetails?: (result: SearchResult) => Promise<FetchedResourceData>;
  
  // Custom card component for displaying this resource type
  CardComponent?: Component<{ resource: unknown }>;
  
  // Custom detail component
  DetailComponent?: Component<{ resource: unknown }>;
}

// Plugin registry
export class PluginRegistry {
  private plugins: Map<string, ResourcePlugin> = new Map();

  register(plugin: ResourcePlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: string): void {
    this.plugins.delete(id);
  }

  get(id: string): ResourcePlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): ResourcePlugin[] {
    return Array.from(this.plugins.values());
  }

  getByInputType(type: 'url' | 'search'): ResourcePlugin[] {
    return this.getAll().filter(p => p.inputType === type);
  }
}

// Global registry instance
export const pluginRegistry = new PluginRegistry();
