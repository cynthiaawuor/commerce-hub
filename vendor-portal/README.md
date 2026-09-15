# Vendor Management Portal

Back-office web dashboard for the procurement team and administrators to browse, add, edit and archive suppliers and manage their catalogs. Talks to [`service-vendor`](../service-vendor) over REST.

## Stack

React + Vite + TypeScript, React Router, TanStack Query, React Hook Form, Tailwind CSS. Tests use Vitest + React Testing Library (+ MSW for API mocking).

## Local development

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

Start `service-vendor` on port 3000 first. The Vite dev server proxies `/api/*` to it.

## Feature flag

The portal belongs to Phase 1 (`vendor-management`). Set `VITE_FEATURE_VENDOR_MANAGEMENT=true` to enable it. Any other value hides the navigation and shows a "Coming soon" screen.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm test` | Run the tests once |
| `npm run test:watch` | Run the tests in watch mode |

## Structure

```
src/
├── config/       env variables and feature flags
├── lib/          API client and formatting helpers
├── types/        Supplier and CatalogItem types
├── features/     suppliers/ and catalog/ — api calls, query hooks, components, pages
├── components/   layout (sidebar, shell) and shared UI
└── pages/        Coming soon and Not found
```
