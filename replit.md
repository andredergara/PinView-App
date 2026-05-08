# PinView — Golf Social Platform

A premium mobile-first golf social platform (TikTok/Instagram for golf shots). Golfers share shot clips, track stats, follow each other, and discover courses and players.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied to /api)
- `pnpm --filter @workspace/pinview run dev` — run the frontend (Vite, proxied to /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed demo data
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + bcrypt
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind CSS + shadcn/ui components
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — Drizzle ORM schema (users, posts, likes, saves, comments, follows, notifications)
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth for all API contracts
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — Generated Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/pinview/src/pages/` — Frontend pages (home, discover, upload, profile, notifications, post, login)
- `artifacts/pinview/src/components/` — Shared components (layout, video-card, ui/*)
- `scripts/src/seed.ts` — Demo data seed script

## Architecture decisions

- Contract-first API design: OpenAPI spec drives both Zod validation on the server and React Query hooks on the client
- Sessions stored in-memory via express-session (cookie-based, httpOnly, 30-day TTL)
- bcrypt with 12 rounds for password hashing
- Feed falls back to global posts when user has no follows (better onboarding)
- enrichPost + buildUserCard helpers in users.ts are imported by all other route files

## Product

Five main screens:
1. **Home Feed** — TikTok-style vertical snap scroll of golf shot cards (image/video, like/save/comment actions, shot metadata badges)
2. **Discover** — Search golfers/courses, trending shots grid, top golfers list, trending courses
3. **Upload** — Post a shot with club, distance, shot shape, shot type, course, hole, tags
4. **Profile** — Avatar, bio, handicap, home course, stats grid, shot grid; follow/unfollow
5. **Notifications** — Likes, comments, follows with real-time unread count

## Demo Accounts

Seeded with 4 demo accounts, all password: `password123`
- `alice@pinview.com` — HCP 6.2, Augusta National
- `bob@pinview.com` — HCP 14.8, Pebble Beach
- `sara@pinview.com` — HCP 2.1, Pinehurst No. 2
- `tiger@pinview.com` — HCP 0.4, TPC Sawgrass

## User preferences

- Dark/green branding (#22c55e primary, near-black background)
- Mobile-first layout (max-width 430px centered)
- No Supabase — uses Replit PostgreSQL with Drizzle ORM

## Gotchas

- After codegen, manually write `lib/api-zod/src/index.ts` as: `export * from "./generated/api";`
- Orval config: zod section uses `mode:"single"`, `target:"generated/api.ts"` (no `schemas` key)
- The seed script uses a pre-computed bcrypt hash. To regenerate: `cd artifacts/api-server && node -e "require('./node_modules/bcrypt').hash('password123',12).then(console.log)"`
- Session cookies require `credentials: true` in CORS and `withCredentials` in fetch (handled by orval-generated client)
- enrichPost does N+1 queries — acceptable for MVP, replace with joins if performance becomes an issue

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
