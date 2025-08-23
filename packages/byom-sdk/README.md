# @byom/sdk

A tiny client for the BYOM service.

## Install

```bash
npm install @byom/sdk
```

## Usage

```tsx
import { BYOMProvider, useBYOM } from '@byom/sdk';

function App() {
  return (
    <BYOMProvider baseUrl={import.meta.env.VITE_BYOM_API_URL}>
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
