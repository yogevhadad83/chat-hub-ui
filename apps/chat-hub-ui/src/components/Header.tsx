export function Header({ modelId }: { modelId?: string }) {
  return (
    <header className="p-4 bg-gray-900 text-white flex justify-between items-center">
      <h1 className="text-xl font-bold">Chat Hub</h1>
      {modelId && <span className="px-2 py-1 bg-gray-700 rounded text-sm">model: {modelId}</span>}
    </header>
  );
}
