# BYOM Monorepo

This repo contains a BYOM SDK and a React chat app that uses it.

## Getting Started

```bash
npm install
npm run dev
```

The dev script builds the SDK in watch mode and starts the Vite dev server for the app at http://localhost:5173.

The chat app expects the BYOM backend URL to be supplied via the `VITE_SAAS_BASE_URL` environment variable.

## Build

```bash
npm run build
```

## Preview

For a production-style preview (e.g., on Render), run:

```bash
npm start
```

This builds the packages and starts the Node server with Socket.IO.

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
<BYOMProvider baseUrl={import.meta.env.VITE_SAAS_BASE_URL}>
  <App />
</BYOMProvider>;

// Register a provider and invoke
const { registerProvider, invoke } = useBYOM();
```
