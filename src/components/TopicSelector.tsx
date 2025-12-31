import { type Component, For, createSignal, Show } from 'solid-js';
import { useTopics } from '../lib/db/hooks';
import { createTopic } from '../lib/db/actions';
import { Badge } from './ui';
import { Plus } from 'lucide-solid';

interface TopicSelectorProps {
  selected: string[];
  onChange: (topicIds: string[]) => void;
}

export const TopicSelector: Component<TopicSelectorProps> = (props) => {
  const { data: topics } = useTopics();
  const [showNew, setShowNew] = createSignal(false);
  const [newName, setNewName] = createSignal('');

  const toggleTopic = (id: string) => {
    if (props.selected.includes(id)) {
      props.onChange(props.selected.filter(t => t !== id));
    } else {
      props.onChange([...props.selected, id]);
    }
  };

  const handleCreateTopic = () => {
    if (!newName().trim()) return;
    
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const topic = createTopic({ name: newName().trim(), color });
    props.onChange([...props.selected, topic.id]);
    setNewName('');
    setShowNew(false);
  };

  return (
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">Topics</label>
      <div class="flex flex-wrap gap-2">
        <For each={topics()}>
          {(topic) => (
            <Badge
              color={props.selected.includes(topic.id) ? topic.color : undefined}
              onClick={() => toggleTopic(topic.id)}
            >
              {topic.name}
            </Badge>
          )}
        </For>
        
        <Show when={!showNew()}>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            onClick={() => setShowNew(true)}
          >
            <Plus class="w-3 h-3" /> New
          </button>
        </Show>
        
        <Show when={showNew()}>
          <div class="flex items-center gap-1">
            <input
              type="text"
              class="px-2 py-0.5 text-xs border rounded-full w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Topic name"
              value={newName()}
              onInput={(e) => setNewName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
            />
            <button
              type="button"
              class="text-xs text-blue-600 hover:text-blue-700"
              onClick={handleCreateTopic}
            >
              Add
            </button>
            <button
              type="button"
              class="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => setShowNew(false)}
            >
              Cancel
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};
