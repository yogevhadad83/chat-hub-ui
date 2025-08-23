import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useRef } from 'react';

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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [centered, setCentered] = useState(false);

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

  // Recalculate placement after open and on resize
  useEffect(() => {
    function updatePlacement() {
      if (!open) return;
      if (triggerRef.current && panelRef.current) {
        const tr = triggerRef.current.getBoundingClientRect();
        const panelH = panelRef.current.getBoundingClientRect().height;
        const top = tr.top - 8 - panelH; // desired top when opening above
        const wouldOverflowTop = top < 8; // 8px margin
        setCentered(wouldOverflowTop);
        setAnchor({ top: tr.top, right: window.innerWidth - tr.right });
      }
    }
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  if (!registered) {
    return (
      <span className="relative inline-flex">
        <button
          ref={triggerRef}
          // High-contrast badge so it doesn't disappear over dark inputs
          className="px-2 py-1 rounded border border-white/70 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/70"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next && triggerRef.current) {
              const r = triggerRef.current.getBoundingClientRect();
              setAnchor({ top: r.top, right: window.innerWidth - r.right });
              setCentered(false);
            }
          }}
        >
          BYOM
        </button>
        {open && (
          <>
            {/* click-away overlay to close when clicking outside popover */}
            {createPortal(
              <div
                className="fixed inset-0 z-[200000]"
                onClick={() => setOpen(false)}
              />, document.body
            )}
            {createPortal(
              <div
                ref={panelRef}
                className="fixed z-[200001] w-[min(92vw,520px)] max-h-[70vh] overflow-auto rounded-xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/10"
                style={
                  centered
                    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
                    : {
                        top: anchor?.top ?? 80,
                        right: anchor?.right ?? 16,
                        transform: 'translateY(calc(-100% - 8px))',
                      }
                }
                role="dialog"
                aria-modal="true"
              >
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
              </div>,
              document.body
            )}
          </>
        )}
      </span>
    );
  }

  return (
    <button
      className="px-2 py-1 rounded border border-white/70 bg-green-600 text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/70"
      onClick={handleInvoke}
    >
      Ask Model
    </button>
  );
}
