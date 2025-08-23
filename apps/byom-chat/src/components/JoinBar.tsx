export function JoinBar({
  userId,
  convId,
  setUserId,
  setConvId,
  onJoin,
}: {
  userId: string;
  convId: string;
  setUserId: (s: string) => void;
  setConvId: (s: string) => void;
  onJoin: () => void;
}) {
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
        onClick={onJoin}
      >
        Join
      </button>
    </div>
  );
}
