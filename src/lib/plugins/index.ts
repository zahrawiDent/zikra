// Plugin registry and initialization
export * from './types';
export { youtubePlugin } from './youtube';
export { bookPlugin } from './book';
export { paperPlugin } from './paper';
export { articlePlugin } from './article';

// Detection engine exports
export * from './detection';

import { pluginRegistry } from './types';
import { youtubePlugin } from './youtube';
import { bookPlugin } from './book';
import { paperPlugin } from './paper';
import { articlePlugin } from './article';
import { initializeDetectors } from './detection';

// Register all built-in plugins and detectors
export function initializePlugins(): void {
  // Register plugins
  pluginRegistry.register(youtubePlugin);
  pluginRegistry.register(bookPlugin);
  pluginRegistry.register(paperPlugin);
  pluginRegistry.register(articlePlugin);
  
  // Initialize detection engine
  initializeDetectors();
}


