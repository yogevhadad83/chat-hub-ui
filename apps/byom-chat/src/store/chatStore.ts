import { useSyncExternalStore } from 'react';
import { Message } from '../types';

export type StoredMessage = Message & { meta?: { modelId?: string } };

const store = new Map<string, StoredMessage[]>();
// Stable empty snapshot to satisfy useSyncExternalStore invariants
const EMPTY: StoredMessage[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getMessages(convId: string): StoredMessage[] {
  // Return a stable reference when there are no messages to avoid infinite
  // re-render loops caused by returning a fresh [] each render.
  return store.get(convId) ?? EMPTY;
}

export function setMessages(convId: string, msgs: StoredMessage[]) {
  // Store a copy to avoid outside mutations affecting our state
  store.set(convId, msgs.slice());
  emit();
}

export function addMessage(convId: string, msg: StoredMessage) {
  // Work on a copy to avoid mutating the shared EMPTY reference
  const existing = store.get(convId);
  const msgs = existing ? existing.slice() : [];
  const idx = msgs.findIndex((m) => m.ts === msg.ts && m.author === msg.author);
  if (idx >= 0) {
    msgs[idx] = msg;
  } else {
    msgs.push(msg);
  }
  store.set(convId, msgs.slice(-500));
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMessages(convId: string) {
  return useSyncExternalStore(subscribe, () => getMessages(convId));
}
