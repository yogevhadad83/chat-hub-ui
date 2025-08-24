import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

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
  onUserPrompt?: (text: string) => void;
  baseUrl?: string;
  // Optional: provide a logo/image URL for the widget button
  buttonLogoSrc?: string;
  // Optional: accessible label for the button, defaults to "BYOM"
  buttonAriaLabel?: string;
};

export function ByomWidget({
  userId,
  conversationId,
  getSnapshot,
  getPrompt,
  onAssistantMessage,
  onUserPrompt,
  baseUrl,
  buttonLogoSrc,
  buttonAriaLabel = 'BYOM',
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
      const prompt = getPrompt();
      onUserPrompt?.(prompt);
      const res = await invoke({
        userId,
        conversationId,
        prompt,
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
          className={`group relative flex items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/90 shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/70 transition-all duration-200 w-8 h-8 hover:w-28`}
          onClick={() => setOpen(true)}
          aria-label={buttonAriaLabel}
        >
          {buttonLogoSrc ? (
            <img
              src={buttonLogoSrc}
              alt={buttonAriaLabel}
              className="w-5 h-5 object-contain"
            />
          ) : (
            <span className="text-xs">BYOM</span>
          )}
          <span className="ml-2 text-xs text-gray-900 whitespace-nowrap opacity-0 group-hover:opacity-100">
            BYOM
          </span>
        </button>
        {open &&
          createPortal(
            <div className="fixed inset-0 z-50 grid place-items-center">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              {/* Dialog */}
              <div className="relative z-10 w-[min(92vw,520px)] max-h-[85vh] overflow-auto rounded-xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/10">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold">Bring Your Own Model</h3>
                  <button
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <label className="block text-sm font-medium">Provider</label>
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as 'openai' | 'http')}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="http">HTTP</option>
                  </select>

                  <input
                    className="border rounded px-2 py-1 w-full"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Model (e.g. gpt-4o)"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                  {provider === 'http' && (
                    <input
                      className="border rounded px-2 py-1 w-full"
                      placeholder="HTTP Endpoint"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                    />
                  )}
                  <textarea
                    className="border rounded px-2 py-2 w-full min-h-24"
                    placeholder="Optional system prompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                  />
                </div>
                <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleRegister}
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }

  return (
    <button
      className={`group relative flex items-center justify-center overflow-hidden rounded-full border border-white/70 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/70 transition-all duration-200 w-8 h-8 hover:w-32 ${
        registered ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/90'
      }`}
      onClick={handleInvoke}
      aria-label={registered ? 'Send to AI' : buttonAriaLabel || 'Ask Model'}
      title={registered ? 'Send to AI' : buttonAriaLabel || 'Ask Model'}
    >
      {buttonLogoSrc ? (
        <img
          src={buttonLogoSrc}
          alt={registered ? 'Send to AI' : buttonAriaLabel}
          className="w-5 h-5 object-contain"
        />
      ) : (
        <span className="text-xs">{registered ? 'AI' : 'Ask'}</span>
      )}
      <span className="ml-2 text-xs text-gray-900 whitespace-nowrap opacity-0 group-hover:opacity-100">
        {registered ? 'Send to AI' : 'BYOM'}
      </span>
    </button>
  );
}
