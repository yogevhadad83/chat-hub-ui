export function Header({
  conversationId,
  connected,
}: {
  conversationId: string;
  connected: boolean;
}) {
  return (
    <header className="p-4 bg-gray-900 text-white flex justify-between items-center">
      <h1 className="text-xl font-bold">Chat: {conversationId}</h1>
      <span
        className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
      ></span>
    </header>
  );
}
