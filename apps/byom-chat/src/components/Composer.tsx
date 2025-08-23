import { useState } from 'react';
import { ByomWidget } from '@chat-hub/byom';
import type { Message } from '../types';

type Props = {
  userId: string;
  conversationId: string;
  onSend: (t: string) => void;
  getSnapshot: () => Message[];
  onAssistantMessage: (msg: { text: string; meta?: { modelId?: string } }) => void;
};

export function Composer({
  userId,
  conversationId,
  onSend,
  getSnapshot,
  onAssistantMessage,
}: Props) {
  const [text, setText] = useState('');
  return (
    <div className="p-4 flex gap-2 bg-gray-800">
      <div className="relative flex-1">
        <input
          className="w-full p-2 bg-gray-700 text-white rounded pr-20"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <ByomWidget
            userId={userId}
            conversationId={conversationId}
            getSnapshot={getSnapshot}
            getPrompt={() => text}
            onAssistantMessage={onAssistantMessage}
          />
        </div>
      </div>
      <button
        className="px-3 py-2 bg-blue-600 text-white rounded"
        onClick={() => {
          if (text.trim()) {
            onSend(text);
            setText('');
          }
        }}
      >
        Send
      </button>
    </div>
  );
}
