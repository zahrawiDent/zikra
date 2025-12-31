// Plugin registry and initialization
export * from './types';
export { youtubePlugin } from './youtube';
export { bookPlugin } from './book';
export { paperPlugin } from './paper';
export { articlePlugin } from './article';

import { pluginRegistry } from './types';
import { youtubePlugin } from './youtube';
import { bookPlugin } from './book';
import { paperPlugin } from './paper';
import { articlePlugin } from './article';

// Register all built-in plugins
export function initializePlugins(): void {
  pluginRegistry.register(youtubePlugin);
  pluginRegistry.register(bookPlugin);
  pluginRegistry.register(paperPlugin);
  pluginRegistry.register(articlePlugin);
}

// Auto-detect plugin from URL
export function detectPluginFromUrl(url: string): string | null {
  const plugins = pluginRegistry.getByInputType('url');
  
  // Check YouTube first (most specific)
  if (youtubePlugin.validate(url)) {
    return 'youtube';
  }
  
  // Fall back to article for any valid URL
  for (const plugin of plugins) {
    if (plugin.id !== 'youtube' && plugin.validate(url)) {
      return plugin.id;
    }
  }
  
  return null;
}
