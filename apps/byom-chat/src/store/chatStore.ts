import { Message } from '../types';

type Stored = Message & { meta?: { modelId?: string } };

const store = new Map<string, Stored[]>();
const participants = new Map<string, Set<string>>();

export function getMessages(convId: string): Stored[] {
  return store.get(convId) ?? [];
}

export function joinConversation(convId: string, userId: string): boolean {
  const set = participants.get(convId) ?? new Set<string>();
  if (set.has(userId)) return true;
  if (set.size >= 2) return false;
  set.add(userId);
  participants.set(convId, set);
  return true;
}

export function addUserMessage(
  convId: string,
  author: string,
  text: string,
  pending = false,
) {
  const msgs = getMessages(convId);
  const msg: Stored = { author, role: 'user', text, ts: Date.now(), pending };
  store.set(convId, [...msgs, msg]);
}

export function addAssistantMessage(
  convId: string,
  author: string,
  text: string,
  modelId?: string,
  pending = false,
) {
  const msgs = getMessages(convId);
  const msg: Stored = {
    author,
    role: 'assistant',
    text,
    ts: Date.now(),
    meta: { modelId },
    pending,
  };
  store.set(convId, [...msgs, msg]);
}

export function revealMessage(convId: string, ts: number) {
  const msgs = getMessages(convId);
  const idx = msgs.findIndex((m) => m.ts === ts);
  if (idx !== -1) {
    msgs[idx].pending = false;
    store.set(convId, [...msgs]);
  }
}
