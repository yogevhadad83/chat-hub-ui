# @chat-hub/byom

A tiny client for the Chat Hub BYOM service.

## Install

```bash
npm install @chat-hub/byom
```

## Usage

```tsx
import { BYOMProvider, useBYOM } from '@chat-hub/byom';

function App() {
  return (
    <BYOMProvider baseUrl="https://chat-hub-ybyy.onrender.com">
      <MyChat />
    </BYOMProvider>
  );
}

function MyChat() {
  const { registerProvider, invoke } = useBYOM();
  // register once
  registerProvider({
    userId: 'alice',
    provider: 'openai',
    config: { apiKey: 'sk-...', model: 'gpt-4' },
  });
  // later invoke
  const res = await invoke({
    userId: 'alice',
    prompt: 'hello',
    conversation: [],
  });
}
```
