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
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <Show when={props.open}>
      <Portal>
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              class="fixed inset-0 bg-black/50 transition-opacity"
              onClick={props.onClose}
            />
            
            {/* Modal */}
            <div
              class={`relative bg-white rounded-xl shadow-xl w-full ${
                sizes[props.size || 'md']
              } transform transition-all`}
            >
              {/* Header */}
              <Show when={props.title}>
                <div class="flex items-center justify-between px-6 py-4 border-b">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {props.title}
                  </h3>
                  <button
                    type="button"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={props.onClose}
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>
              </Show>
              
              {/* Content */}
              <div class="px-6 py-4">
                {props.children}
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
