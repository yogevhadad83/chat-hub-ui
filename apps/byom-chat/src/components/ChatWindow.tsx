import { Message } from '../types';

type Props = {
  messages: (Message & { meta?: { modelId?: string } })[];
  currentUserId: string;
  onReveal: (_ts: number) => void;
};

export function ChatWindow({ messages, currentUserId, onReveal }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100 dark:bg-gray-900">
      {messages.map((m, i) => {
        const isMe = m.author === currentUserId;
        const align = isMe ? 'text-right' : 'text-left';
        const baseColor = isMe
          ? 'bg-blue-600 text-white'
          : m.role === 'assistant'
            ? 'bg-gray-200 dark:bg-gray-700 dark:text-white'
            : 'bg-gray-300 dark:bg-gray-700 dark:text-white';
        const pendingStyle = m.pending ? 'opacity-60 border border-dashed border-yellow-500' : '';
        return (
          <div key={i} className={align}>
            {!isMe && m.role === 'user' && (
              <div className="text-xs text-gray-500">{m.author}</div>
            )}
            <div
              className={`inline-block px-3 py-2 rounded max-w-xl break-words ${baseColor} ${pendingStyle}`}
            >
              {m.text}
              {m.pending && (
                <>
                  <div className="text-xs text-yellow-600 mt-1">Pending</div>
                  <button
                    className="block text-xs text-blue-600 underline"
                    onClick={() => onReveal(m.ts)}
                  >
                    Show in chat
                  </button>
                </>
              )}
            </div>
            {m.role === 'assistant' && m.meta?.modelId && (
              <div className="text-xs text-gray-500">served by {m.meta.modelId}</div>
            )}
            <div className="text-xs text-gray-500">
              {new Date(m.ts).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
