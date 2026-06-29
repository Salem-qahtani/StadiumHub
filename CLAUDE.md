# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

StadiumHub is a two-sided stadium-booking platform. **Owners** publish stadiums and time slots; **organizers** browse and reserve slots; the two parties chat in real time. It is a monorepo with two independent npm packages that are run and installed separately:

- `server/` — Express 5 + TypeScript REST API + Socket.IO, Prisma ORM over PostgreSQL.
- `client/` — React 19 + TypeScript SPA built with Vite, React Router 7, axios.

There is no root-level package — run all commands from inside `server/` or `client/`.

## Commands

### Server (`cd server`)
- `npm run dev` — start the API with hot reload (`tsx watch src/index.ts`). Listens on `PORT` (default 3000).
- `npx prisma migrate dev` — apply/create migrations.
- `npx prisma generate` — regenerate the client. **Note:** the Prisma client is generated to `src/generated/prisma/` (committed, non-standard location), not `node_modules`. Regenerate after editing `prisma/schema.prisma`.
- `npx prisma studio` — inspect the database.
- No test runner is configured (`npm test` is a stub).

### Client (`cd client`)
- `npm run dev` — Vite dev server.
- `npm run build` — type-check then build (`tsc -b && vite build`).
- `npm run lint` — ESLint over the project.

### Environment
`server/.env` is required with: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URL` (used for both CORS origin and Socket.IO CORS). The client API base URL is hard-coded to `http://localhost:3000/api` in `client/src/services/api.ts`.

## Architecture

### Backend conventions
- **ESM with `.js` import specifiers.** `tsconfig` uses `module: nodenext`, so all relative imports must carry a `.js` extension even though the source is `.ts` (e.g. `import protect from "../middlewares/protect.js"`). Match this when adding files.
- **Layering:** `routes/ → controllers/ → lib/prisma.ts`. Each domain (auth, stadium, slot, reservation, conversation, message) has a matching route file and controller file. `src/index.ts` mounts them under `/api/*` and wires Socket.IO.
- **Single Prisma client** (`src/lib/prisma.ts`) uses the `@prisma/adapter-pg` driver adapter over a `pg` connection string. Import the default export everywhere.
- **Auth:** `middlewares/protect.ts` verifies the `Authorization: Bearer <jwt>` header and attaches `req.userId`, `req.username`, `req.userRole`. These fields are added to Express's `Request` via the module augmentation in `src/types/express.d.ts`. The JWT payload is `{ id, username, role }`. Apply `protect` to every route except `/api/auth/*`.
- **Role checks live in controllers**, not middleware — controllers compare `req.userRole` against `"owner"` / `"organizer"` and return 403. Roles are validated at signup (only those two allowed).
- **Controllers** are `async (req, res, next)` and forward errors with `next(error)` to the global error handler in `index.ts`. They return JSON `{ error }` on failure.
- **Concurrency:** slot booking and cancellation use `prisma.$transaction`. Booking does an atomic `updateMany({ where: { available: true } })` claim and only creates the reservation if `count > 0`, returning 409 otherwise — this is the pattern to follow for any race-sensitive slot mutation. Cancellation frees the slot in the same transaction.
- **Image uploads:** `POST /api/uploads` (route `routes/uploadRoutes.ts`, controller `controllers/uploadControllers.ts`) accepts `multipart/form-data` images and stores them on **Cloudinary** (`lib/cloudinary.ts`, configured from the `CLOUDINARY_URL` env var). Upload-specific middleware lives in `middlewares/uploadImages.ts`: `requireOwner` (rejects non-owners *before* multer buffers files) + `handleUpload` (multer `memoryStorage`, max 6 images, 5MB each, image-only, with errors mapped to 400s). The controller base64-encodes each in-memory buffer and returns the Cloudinary `secure_url`s. **Only the URLs are persisted** (`Stadium.images String[]`) — no image bytes touch the DB or disk. The client uploads first, then sends those URLs when creating/updating a stadium; `stadiumControllers.ts` validates that every image is a `https://res.cloudinary.com/` URL.

### Real-time messaging (Socket.IO)
- Chat is scoped to organizer↔owner conversations; `Conversation` is unique per `[organizerId, ownerId]` pair.
- `src/socket.ts` holds a module-level `io` singleton: `initSocket(httpServer)` creates it, `getIO()` retrieves it elsewhere. `src/index.ts` creates a raw `http.Server`, calls `initSocket`, and Socket.IO and Express share that server.
- Socket auth mirrors the REST layer: an `io.use` middleware verifies `socket.handshake.auth.token` (same JWT) and populates `socket.data.userId/username/userRole`.
- Clients emit `joinConversation` with a conversation id; the server authorizes via `getUserConversation(conversationId, userId)` (a membership check exported from `messageControllers.ts`) before joining the `conversation:<id>` room.
- This feature is COMPLETE: `sendMessage` persists then emits `newMessage` into `conversation:<id>`; the client has a full realtime chat (`pages/Messages/`, `services/socket.ts`). Conversations are hidden from the inbox until they have ≥1 message (`getMyConversations` filters `messages: { some: {} }`); a brand-new conversation is deep-linked with `{ conversationId, peerName }` via router state.

### Frontend
- **Auth state** lives in `contexts/AuthContext.tsx` (`useAuth` hook). The user object and token are persisted to `localStorage` and rehydrated on load; `isAuthenticated` gates `ProtectedRoute`.
- **API access** goes through the shared axios instance in `services/api.ts`, which injects the bearer token from `localStorage` on every request and, on a 401 from a non-auth route, clears the session and redirects to `/sign`.
- **Routing** (`App.tsx`): `/` (Home), `/sign` (combined sign-in/up), `/dashboard` (protected; renders `DashboardLayout` with nested role-aware routes via `RoleSwitch`). Route paths are lowercase. Components are organized one-folder-per-component under `src/components/` and `src/pages/`.
- **Shared layout/UI:** reusable primitives live in `src/components/ui/*` (Button, Modal, Field, Toast, Badge, Spinner, EmptyState, PageHeader, ImageUploader/ImageCropModal, icons). Layout pieces in `src/components/layout/*` (Navbar, DashboardLayout, Footer). The `Footer` is global: it takes `{ bg, variant: "dark" | "light" }` and is rendered per page so its background matches that page's background. A global `::selection` (green) lives in `index.css`; the user identity shown in UI is always `user.username`.

## Data model (`server/prisma/schema.prisma`)
`User` (role: owner|organizer) → owns `Stadium[]` → has `Slot[]` (date + start/end time strings + `available` flag) → has `Reservation[]` (status: confirmed|cancelled). Messaging: `Conversation` links one organizer + one owner and has `Message[]` (with `read` flag). Deleting a stadium/slot cascades to its slots/reservations/messages; conversation participants use `onDelete: Restrict`.

## Current status (2026-06-29)
All client pages (owner O1–O4, organizer G1–G3, messaging S1) and the realtime messaging feature are built. A full QA + code-review + security pass was completed; fixes applied include the `formatSlotDate` UTC off-by-one, a `cancelReservation` TOCTOU race (status claim now inside the `$transaction`), an SVG-XSS upload allowlist, JWT `algorithms:["HS256"]` pinning, `express-rate-limit` (auth 10/15min + global 300/15min), and assorted input validation. Server boot now fails fast if `FRONTEND_URL` is unset. **Remaining before done:** user runs a 2-session realtime e2e test, then commit (work is currently uncommitted). A few low-priority nits are knowingly deferred (see memory `pre-commit-review-2026-06-29.md`).

## Deployment (planned: Railway)
Not deployed yet. At deploy time: **uncomment `app.set("trust proxy", 1)` in `server/src/index.ts`** (required for correct per-IP rate limiting behind Railway's edge proxy — never use `true`). Set Railway env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`, `CLOUDINARY_URL`. The client API base is hard-coded to `http://localhost:3000/api` in `client/src/services/api.ts` and must be pointed at the deployed API URL. See memory `deployment-railway-todo.md`.
