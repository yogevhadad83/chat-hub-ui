import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
} from 'react';

interface ProviderProps {
  baseUrl: string;
  onError?: (e: unknown) => void;
  children: React.ReactNode;
}

interface RegisterArgs {
  userId: string;
  provider: 'openai' | 'http';
  config: {
    apiKey?: string;
    model?: string;
    endpoint?: string;
    systemPrompt?: string;
  };
}

export interface Message {
  author: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
}

interface InvokeArgs {
  userId: string;
  conversationId?: string;
  prompt: string;
  conversation: Message[];
}

interface InvokeResult {
  reply: string;
  meta?: { modelId?: string };
}

const Ctx = createContext<{ baseUrl: string; onError?: (e: unknown) => void } | null>(null);

export function BYOMProvider({ baseUrl, onError, children }: ProviderProps) {
  const value = useMemo(() => ({ baseUrl, onError }), [baseUrl, onError]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBYOM(baseUrlOverride?: string) {
  const ctx = useContext(Ctx);
  const baseUrl = baseUrlOverride ?? ctx?.baseUrl;
  const onError = ctx?.onError;
  if (!baseUrl) throw new Error('useBYOM must be used within BYOMProvider');

  async function registerProvider(args: RegisterArgs): Promise<void> {
    const res = await fetch(`${baseUrl}/register-provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const msg = await res.text();
      const err = new Error(msg || res.statusText);
      onError?.(err);
      throw err;
    }
  }

  async function invoke(args: InvokeArgs): Promise<InvokeResult> {
    const payload = { ...args, conversation: args.conversation.slice(-50) };
    const res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) {
      const err = new Error(json?.error || res.statusText);
      onError?.(err);
      throw err;
    }
    return json as InvokeResult;
  }

  return { registerProvider, invoke };
}

export type { RegisterArgs, InvokeArgs, InvokeResult };

export type ByomWidgetProps = {
  userId: string;
  conversationId: string;
  getSnapshot: () => Message[];
  getPrompt: () => string;
  onAssistantMessage: (msg: {
    text: string;
    meta?: { modelId?: string };
  }) => void;
  baseUrl?: string;
};

export function ByomWidget({
  userId,
  conversationId,
  getSnapshot,
  getPrompt,
  onAssistantMessage,
  baseUrl,
}: ByomWidgetProps) {
  const ctx = useContext(Ctx);
  const resolvedBase = baseUrl ?? ctx?.baseUrl ?? '';
  const { registerProvider, invoke } = useBYOM(resolvedBase);
  const [registered, setRegistered] = useState(false);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'http'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!resolvedBase) return;
      try {
        const res = await fetch(`${resolvedBase}/providers/${userId}`);
        if (!cancelled) setRegistered(res.ok);
      } catch {
        if (!cancelled) setRegistered(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [resolvedBase, userId]);

  async function handleRegister() {
    try {
      await registerProvider({
        userId,
        provider,
        config: { apiKey, model, endpoint, systemPrompt },
      });
      setRegistered(true);
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleInvoke() {
    try {
      const res = await invoke({
        userId,
        conversationId,
        prompt: getPrompt(),
        conversation: getSnapshot(),
      });
      onAssistantMessage({ text: res.reply, meta: res.meta });
    } catch (e: any) {
      onAssistantMessage({ text: String(e) });
    }
  }

  if (!registered) {
    return (
      <>
        <button
          className="px-2 py-1 bg-gray-600 text-white rounded"
          onClick={() => setOpen(true)}
        >
          BYOM
        </button>
        {open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white text-black p-4 rounded space-y-2 w-80">
              <select
                className="border p-1 w-full"
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'openai' | 'http')}
              >
                <option value="openai">OpenAI</option>
                <option value="http">HTTP</option>
              </select>
              <input
                className="border p-1 w-full"
                placeholder="API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <input
                className="border p-1 w-full"
                placeholder="Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              {provider === 'http' && (
                <input
                  className="border p-1 w-full"
                  placeholder="Endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
              )}
              <textarea
                className="border p-1 w-full"
                placeholder="System Prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={handleRegister}
                >
                  Register
                </button>
                <button
                  className="px-3 py-1 bg-gray-300 rounded"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      className="px-2 py-1 bg-green-600 text-white rounded"
      onClick={handleInvoke}
    >
      Ask Model
    </button>
  );
}
