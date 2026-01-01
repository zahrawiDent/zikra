/**
 * Mobile Navigation Components
 * 
 * Provides mobile-optimized navigation with:
 * - Bottom navigation bar for quick access
 * - Floating Action Button (FAB) for adding resources
 * - Slide-out drawer menu trigger
 */

import { type Component, createSignal, Show, For } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { Home, BookOpen, FolderOpen, Menu, Plus, X } from 'lucide-solid';

interface MobileNavProps {
  onAddResource: () => void;
  onMenuOpen: () => void;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/resources', icon: BookOpen, label: 'Resources' },
  { path: '/categories', icon: FolderOpen, label: 'Categories' },
];

/**
 * Bottom navigation bar for mobile devices
 */
export const MobileBottomNav: Component<MobileNavProps> = (props) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t z-40 md:hidden safe-area-bottom">
      <div class="flex items-center justify-around h-16">
        {/* Menu button */}
        <button
          type="button"
          class="flex flex-col items-center justify-center flex-1 h-full text-gray-500 hover:text-blue-600"
          onClick={props.onMenuOpen}
        >
          <Menu class="w-5 h-5" />
          <span class="text-xs mt-1">Menu</span>
        </button>

        {/* Nav items */}
        <For each={navItems}>
          {(item) => (
            <A
              href={item.path}
              class={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive(item.path)
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <item.icon class="w-5 h-5" />
              <span class="text-xs mt-1">{item.label}</span>
            </A>
          )}
        </For>
      </div>
    </nav>
  );
};

/**
 * Floating Action Button for adding resources
 */
export const FloatingActionButton: Component<{ onClick: () => void }> = (props) => {
  return (
    <button
      type="button"
      class="fixed right-4 bottom-20 md:hidden z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all flex items-center justify-center"
      onClick={props.onClick}
      aria-label="Add Resource"
    >
      <Plus class="w-6 h-6" />
    </button>
  );
};

/**
 * Mobile drawer overlay
 */
interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: any;
}

export const MobileDrawer: Component<MobileDrawerProps> = (props) => {
  return (
    <Show when={props.open}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={props.onClose}
      />
      
      {/* Drawer */}
      <div class="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden shadow-xl transform transition-transform duration-300 animate-slide-in-left">
        {/* Close button */}
        <button
          type="button"
          class="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
          onClick={props.onClose}
        >
          <X class="w-5 h-5" />
        </button>
        
        {props.children}
      </div>
    </Show>
  );
};

/**
 * Mobile header with menu button
 */
interface MobileHeaderProps {
  title?: string;
  onMenuOpen: () => void;
  rightContent?: any;
}

export const MobileHeader: Component<MobileHeaderProps> = (props) => {
  return (
    <header class="sticky top-0 bg-white border-b z-30 md:hidden safe-area-top">
      <div class="flex items-center justify-between h-14 px-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            onClick={props.onMenuOpen}
          >
            <Menu class="w-5 h-5" />
          </button>
          <Show when={props.title}>
            <h1 class="text-lg font-semibold text-gray-900 truncate">{props.title}</h1>
          </Show>
          <Show when={!props.title}>
            <span class="text-lg font-bold text-gray-900">🦷 DentStudy</span>
          </Show>
        </div>
        <Show when={props.rightContent}>
          {props.rightContent}
        </Show>
      </div>
    </header>
  );
};
