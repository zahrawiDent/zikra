import { type Component, Show } from 'solid-js';
import { useThumbnail } from '../../lib/db/hooks';

interface ThumbnailImageProps {
  src: string | undefined;
  alt?: string;
  class?: string;
  fallbackClass?: string;
}

export const ThumbnailImage: Component<ThumbnailImageProps> = (props) => {
  const resolvedUrl = useThumbnail(() => props.src);

  return (
    <Show 
      when={resolvedUrl()} 
      fallback={
        <Show when={props.fallbackClass}>
          <div class={props.fallbackClass} />
        </Show>
      }
    >
      <img
        src={resolvedUrl()}
        alt={props.alt || ''}
        class={props.class}
        onError={(e) => e.currentTarget.style.display = 'none'}
      />
    </Show>
  );
};
