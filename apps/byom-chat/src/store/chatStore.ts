import { useSyncExternalStore } from 'react';
import { Message } from '../types';

export type StoredMessage = Message & {
  meta?: { modelId?: string; sentToAI?: boolean };
  // When true, the message is visible only to the local user until published.
  ephemeral?: boolean;
};

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
  const sorted = msgs.slice().sort((a, b) => a.ts - b.ts);
  store.set(convId, sorted);
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
    // Insert in timestamp order (ascending) so all clients see consistent ordering
    let insertAt = msgs.length;
    // Fast-path: if list is empty or new ts is >= last, append
    if (msgs.length === 0 || msg.ts >= msgs[msgs.length - 1].ts) {
      msgs.push(msg);
    } else {
      // Find first index with ts greater than new ts
      for (let i = 0; i < msgs.length; i++) {
        if (msg.ts < msgs[i].ts) {
          insertAt = i;
          break;
        }
      }
      msgs.splice(insertAt, 0, msg);
    }
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
