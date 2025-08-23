import { Message } from '../types';

type Props = { messages: (Message & { meta?: { modelId?: string } })[] };

export function ChatWindow({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100 dark:bg-gray-900">
      {messages.map((m, i) => (
        <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
          <div
            className={`inline-block px-3 py-2 rounded max-w-xl break-words ${
              m.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
            }`}
          >
            {m.text}
          </div>
          {m.role === 'assistant' && m.meta?.modelId && (
            <div className="text-xs text-gray-500">served by {m.meta.modelId}</div>
          )}
          <div className="text-xs text-gray-500">
            {new Date(m.ts).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
