# Yantra — Web Game

Multiplayer browser version of the board game **Yantra**, playable on mobile and desktop.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Node.js + Express + Socket.io |
| Database | Supabase (free Postgres) |
| Hosting | Vercel (frontend) + Render (backend) |
| Shared types | npm workspace `@yantra/shared` |

---

## Project structure

```
yantra/
├── packages/
│   ├── shared/          ← TypeScript types, board layout, constants
│   ├── server/          ← Express + Socket.io server + game engine
│   └── client/          ← Vite + React frontend
├── supabase-schema.sql  ← Run once in Supabase SQL editor
└── README.md
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase-schema.sql`
3. Copy your **Project URL** and **Service Role Key** from Project Settings → API

### 3. Configure environment variables

```bash
# packages/server/.env
cp packages/server/.env.example packages/server/.env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# packages/client/.env
cp packages/client/.env.example packages/client/.env
# VITE_SERVER_URL defaults to http://localhost:3001
```

### 4. Run locally

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### 5. Test the engine

```bash
npm run test -w packages/server
```

---

## Deploying

### Backend → Render (free)

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Root directory: `packages/server`
4. Build command: `npm install && npm run build`
5. Start command: `node dist/index.js`
6. Add env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_ORIGIN`

### Frontend → Vercel (free)

1. Import repo at [vercel.com](https://vercel.com)
2. Root directory: `packages/client`
3. Build command: `npm run build`
4. Output: `dist`
5. Add env var: `VITE_SERVER_URL=https://your-render-service.onrender.com`

---

## Board notes

The board layout (`packages/shared/src/boardLayout.ts`) is a best-estimate approximation
based on the hand-drawn scans. **Verify booster square positions against the physical board**
before publishing, and update `BOOSTERS` in `boardLayout.ts` accordingly.

The board is defined as a 15×15 grid where valid squares satisfy:
```
(row − 7)² + (col − 7)² ≤ 72
```
giving ≈ 205 squares (game rules cite 167 + 37 = 204).

---

## Game rules summary

See `packages/client/src/pages/RulesPage.tsx` or the in-app Rules screen.
