import { useState } from 'react';

export function JoinBar({ onJoin }: { onJoin: (userId: string, convId: string) => void }) {
  const [userId, setUserId] = useState('');
  const [convId, setConvId] = useState('');
  return (
    <div className="p-4 flex gap-2 bg-gray-800">
      <input
        className="flex-1 rounded p-2 bg-gray-700 text-white"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <input
        className="flex-1 rounded p-2 bg-gray-700 text-white"
        placeholder="Conversation ID"
        value={convId}
        onChange={(e) => setConvId(e.target.value)}
      />
      <button
        className="px-3 py-2 bg-blue-600 text-white rounded"
        onClick={() => onJoin(userId, convId)}
      >
        Join
      </button>
    </div>
  );
}
