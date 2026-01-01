import { type Component, Show } from 'solid-js';
import { Download } from 'lucide-solid';
import { usePWAInstall } from '../lib/hooks';

interface InstallButtonProps {
  /** Compact mode for mobile/tight spaces */
  compact?: boolean;
  /** Class name override */
  class?: string;
}

/**
 * PWA Install Button
 * Only shows when the app can be installed (not already installed)
 * Clean, subtle design that doesn't clutter the UI
 */
export const InstallButton: Component<InstallButtonProps> = (props) => {
  const { canInstall, install } = usePWAInstall();

  return (
    <Show when={canInstall()}>
      <button
        type="button"
        onClick={install}
        class={props.class ?? `
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm
          text-gray-600 hover:text-blue-600 hover:bg-blue-50
          transition-colors group
          ${props.compact ? 'justify-center' : ''}
        `}
        title="Install Zikra App"
      >
        <Download class="w-4 h-4 group-hover:animate-bounce" />
        <Show when={!props.compact}>
          <span>Install App</span>
        </Show>
      </button>
    </Show>
  );
};
