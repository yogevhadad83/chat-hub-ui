import { useState } from 'react';

type Props = {
  onSend: (text: string) => void;
  onInvoke: (text: string) => void;
  modelRegistered: boolean;
};

export function Composer({ onSend, onInvoke, modelRegistered }: Props) {
  const [text, setText] = useState('');
  return (
    <div className="p-4 flex gap-2 bg-gray-800">
      <input
        className="flex-1 p-2 bg-gray-700 text-white rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message"
      />
      <button
        className="px-3 py-2 bg-blue-600 text-white rounded"
        onClick={() => {
          onSend(text);
          setText('');
        }}
      >
        Send
      </button>
      <button
        className={`group flex items-center rounded-full text-white transition-all hover:scale-110 ${
          modelRegistered
            ? 'bg-green-600 animate-pulse shadow-lg shadow-green-500/50'
            : 'bg-gray-600'
        } px-2`}
        onClick={() => {
          onInvoke(text);
          setText('');
        }}
      >
        <span className="text-xs">🤖</span>
        <span
          className="ml-1 overflow-hidden whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-300"
        >
          {modelRegistered ? 'Send to AI' : 'BYOM'}
        </span>
      </button>
    </div>
  );
}
