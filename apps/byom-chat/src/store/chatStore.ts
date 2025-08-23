import { useSyncExternalStore } from 'react';
import { Message } from '../types';

export type StoredMessage = Message & { meta?: { modelId?: string } };

const store = new Map<string, StoredMessage[]>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getMessages(convId: string): StoredMessage[] {
  return store.get(convId) ?? [];
}

export function setMessages(convId: string, msgs: StoredMessage[]) {
  store.set(convId, msgs);
  emit();
}

export function addMessage(convId: string, msg: StoredMessage) {
  const msgs = getMessages(convId);
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
