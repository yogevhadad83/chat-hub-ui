import React, { createContext, useContext, useMemo } from 'react';

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

export function useBYOM() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBYOM must be used within BYOMProvider');
  const { baseUrl, onError } = ctx;

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
