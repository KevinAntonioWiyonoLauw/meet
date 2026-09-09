# Meet — when2meet-style scheduler

Next.js 16 + Bun + SQLite (node:sqlite). No accounts. Create an event, share a link, everyone clicks the cells they're free.

## Stack
- **Frontend/Backend:** Next.js 16 App Router, server components + route handlers
- **Runtime:** Bun 1.4.2 (dev + production container, `bun server.js`)
- **DB:** SQLite via `node:sqlite` (bundled with Node 22+/Bun), WAL mode, `data/meet.db`

## Run locally
```bash
bun install
bun run dev
```
Then open http://localhost:3000

## Deploy
GitHub Actions builds `linux/arm64`, pushes to GHCR (`ghcr.io/kevinantoniowiyonolauw/meet`), Portainer stack `meet` pulls and runs it behind Traefik at `meet.kevinio.my.id`.

- Portainer stack compose lives in `portainer/meet.yml`.
- DB persists via named volume `meet-data` at `/data/meet.db`.

## API
- `POST /api/events` — create event `{title, dates[], start, end, step}` → `{id}`
- `GET /api/events/[id]` — event + responses + counts
- `POST /api/events/[id]` — upsert availability `{name, slots[]}`

## Layout
```
app/page.tsx              landing + create form
app/meet/[id]/page.tsx    scheduling grid (client)
app/api/events/...        API
components/ui/            shadcn/ui primitives
lib/db.ts                 sqlite schema
lib/slots.ts              time helpers
```