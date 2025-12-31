import { type Component, type JSX, splitProps } from 'solid-js';

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: Component<InputProps> = (props) => {
  const [local, rest] = splitProps(props, ['label', 'error', 'class']);
  
  return (
    <div class="w-full">
      {local.label && (
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {local.label}
        </label>
      )}
      <input
        class={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          local.error ? 'border-red-500' : 'border-gray-300'
        } ${local.class || ''}`}
        {...rest}
      />
      {local.error && (
        <p class="mt-1 text-sm text-red-600">{local.error}</p>
      )}
    </div>
  );
};

interface TextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: Component<TextareaProps> = (props) => {
  const [local, rest] = splitProps(props, ['label', 'error', 'class']);
  
  return (
    <div class="w-full">
      {local.label && (
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {local.label}
        </label>
      )}
      <textarea
        class={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
          local.error ? 'border-red-500' : 'border-gray-300'
        } ${local.class || ''}`}
        {...rest}
      />
      {local.error && (
        <p class="mt-1 text-sm text-red-600">{local.error}</p>
      )}
    </div>
  );
};
