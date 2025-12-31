import { type Component, type JSX } from 'solid-js';

interface BadgeProps {
  color?: string;
  children: JSX.Element;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

export const Badge: Component<BadgeProps> = (props) => {
  const bgColor = () => props.color ? `${props.color}20` : '#e5e7eb';
  const textColor = () => props.color || '#374151';
  
  return (
    <span
      class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        props.onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      style={{
        'background-color': bgColor(),
        color: textColor(),
      }}
      onClick={props.onClick}
    >
      {props.children}
      {props.removable && (
        <button
          type="button"
          class="ml-0.5 hover:opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            props.onRemove?.();
          }}
        >
          ×
        </button>
      )}
    </span>
  );
};
