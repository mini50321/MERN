# Mavy Frontend

React + Vite frontend application for Mavy Healthcare Platform.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Structure

- `src/react-app/` - Main React application
- `src/shared/` - Shared types and utilities
- `src/worker/` - Legacy Cloudflare Worker code (being migrated)

## Development

The frontend connects to the backend API running on `http://localhost:3000`.

All API calls use relative paths (`/api/*`) which are proxied to the backend server.

