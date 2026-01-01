import { type Component, type JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X } from 'lucide-solid';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: Component<ModalProps> = (props) => {
  const sizes = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-md',
    lg: 'md:max-w-lg',
    xl: 'md:max-w-xl',
  };

  return (
    <Show when={props.open}>
      <Portal>
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-full items-end md:items-center justify-center md:p-4">
            {/* Backdrop */}
            <div
              class="fixed inset-0 bg-black/50 transition-opacity"
              onClick={props.onClose}
            />
            
            {/* Modal - full screen on mobile, centered on desktop */}
            <div
              class={`relative bg-white w-full h-[90vh] md:h-auto md:rounded-xl shadow-xl ${
                sizes[props.size || 'md']
              } transform transition-all rounded-t-2xl md:rounded-xl`}
            >
              {/* Header */}
              <Show when={props.title}>
                <div class="flex items-center justify-between px-4 md:px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl md:rounded-t-xl z-10">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {props.title}
                  </h3>
                  <button
                    type="button"
                    class="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors touch-target"
                    onClick={props.onClose}
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>
              </Show>
              
              {/* Content */}
              <div class="px-4 md:px-6 py-4 overflow-y-auto max-h-[calc(90vh-4rem)] md:max-h-none">
                {props.children}
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
