import { useState } from 'react';

export function Composer({ onSend, onInvoke }: { onSend: (t: string) => void; onInvoke: (t: string) => void }) {
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
        className="px-3 py-2 bg-green-600 text-white rounded"
        onClick={() => {
          onInvoke(text);
          setText('');
        }}
      >
        Invoke my model
      </button>
    </div>
  );
}
