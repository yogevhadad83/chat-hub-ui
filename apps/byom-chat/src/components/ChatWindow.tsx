import { Message } from '../types';

type Props = {
  messages: (Message & { meta?: { modelId?: string } })[];
  onPublishAssistant?: (m: Message & { meta?: { modelId?: string } }) => void;
};

export function ChatWindow({ messages, onPublishAssistant }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
      {messages.map((m, i) => {
        const isUser = m.role === 'user';
        const isAssistant = m.role === 'assistant';
        const isEphemeral = Boolean(m.ephemeral);
        return (
          <div key={i} className={isUser ? 'text-right' : 'text-left'}>
            <div
              className={`inline-flex items-start gap-3 max-w-2xl ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl shadow-sm border text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  isUser
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                } ${isAssistant && isEphemeral ? 'opacity-80 ring-1 ring-amber-400/60' : ''}`}
              >
                {m.text}
              </div>
              {isAssistant && isEphemeral && (
                <button
                  className="self-center text-xs px-2 py-1 rounded border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  onClick={() => onPublishAssistant?.(m)}
                >
                  Show in chat
                </button>
              )}
            </div>
            {isAssistant && m.meta?.modelId && (
              <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">served by {m.meta.modelId}</div>
            )}
            <div className="text-[10px] mt-0.5 text-gray-400">
              {new Date(m.ts).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
