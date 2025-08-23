# Chat Hub Monorepo

This repo contains a BYOM SDK and a React chat app that uses it.

## Getting Started

```bash
npm install
npm run dev
```

The dev script builds the SDK in watch mode and starts the Vite dev server for the app at http://localhost:5173.

## Build

```bash
npm run build
```

## Type Checking and Linting

```bash
npm run typecheck
npm run lint
```

## Publishing the SDK

```bash
cd packages/byom-sdk
npm version patch
npm publish --access public
```

## Using the SDK in Your App

```tsx
import { BYOMProvider, useBYOM } from "@chat-hub/byom";

// Wrap your app
<BYOMProvider baseUrl="https://chat-hub-ybyy.onrender.com">
  <App />
</BYOMProvider>;

// Register a provider and invoke
const { registerProvider, invoke } = useBYOM();
```
