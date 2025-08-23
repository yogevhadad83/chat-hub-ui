import { Message } from '../types';

type Stored = Message & { meta?: { modelId?: string } };

const store = new Map<string, Stored[]>();

export function getMessages(convId: string): Stored[] {
  return store.get(convId) ?? [];
}

export function addUserMessage(convId: string, author: string, text: string) {
  const msgs = getMessages(convId);
  const msg: Stored = { author, role: 'user', text, ts: Date.now() };
  store.set(convId, [...msgs, msg]);
}

export function addAssistantMessage(convId: string, author: string, text: string, modelId?: string) {
  const msgs = getMessages(convId);
  const msg: Stored = { author, role: 'assistant', text, ts: Date.now(), meta: { modelId } };
  store.set(convId, [...msgs, msg]);
}
