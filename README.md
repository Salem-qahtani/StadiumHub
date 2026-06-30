# StadiumHub 

> A two-sided stadium-booking platform. **Owners** publish stadiums and time slots; **organizers** browse and reserve them; both parties chat in real time.

StadiumHub is a full-stack TypeScript monorepo: an Express + Prisma REST API with Socket.IO for live chat, and a React 19 single-page app. It is deployed and live on Railway.

---

## 🚀 Live Demo

**🔗 https://stadiumhubs.com**

### Try it instantly

You can sign up and create your own account from the **Sign** page, or use one of the pre-seeded demo accounts for a quick look:

| Role | Username | Password | What you can do |
| --- | --- | --- | --- |
| **Owner** | `admin3` | `12345678A` | Publish stadiums, manage time slots, view incoming reservations, chat with organizers |
| **Organizer** | `user2` | `12345678B` | Browse stadiums, reserve slots, manage your reservations, chat with owners |

> Tip: open the two accounts in separate browsers (or one normal + one incognito window) to see the **real-time chat** and live reservation updates between an owner and an organizer.

---

## ✨ Features

- **Two roles, one app** — owners and organizers get role-aware dashboards from a single sign-in.
- **Stadium management** — owners create, edit, and delete stadiums with multiple images.
- **Time-slot scheduling** — owners publish dated slots (start/end time); organizers reserve them.
- **Race-safe booking** — slot claims are atomic, so two organizers can never double-book the same slot.
- **Reservations** — organizers view and cancel their bookings; owners see incoming reservations.
- **Real-time messaging** — organizer ↔ owner chat over Socket.IO, scoped per conversation.
- **Image uploads** — images are stored on Cloudinary; only the URLs are persisted.
- **Secure by default** — JWT auth, bcrypt password hashing, per-IP rate limiting, and server-side role checks.

---

## 🧱 Tech Stack

### Backend (`server/`)
| Area | Technology |
| --- | --- |
| Runtime | Node.js (ESM, run via `tsx`) |
| Language | TypeScript (strict, `module: nodenext`) |
| Framework | Express 5 |
| Real-time | Socket.IO |
| ORM / DB | Prisma 7 + PostgreSQL (`@prisma/adapter-pg` over `pg`) |
| Auth | JSON Web Tokens (`jsonwebtoken`) + `bcrypt` |
| Uploads | `multer` (in-memory) → Cloudinary |
| Hardening | `express-rate-limit`, `cors` |

### Frontend (`client/`)
| Area | Technology |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| HTTP | axios |
| Real-time | socket.io-client |
| Images | react-easy-crop (crop before upload) |
| Lint | ESLint 10 + typescript-eslint |

### Infrastructure
| Area | Technology |
| --- | --- |
| Hosting | Railway (3 services: PostgreSQL + backend + static frontend) |
| Image CDN | Cloudinary |

---

## 🏗️ Architecture

### Backend layering
```
routes/  →  controllers/  →  lib/prisma.ts
```
- Each domain (auth, stadium, slot, reservation, conversation, message, upload) has a matching route + controller file.
- A single Prisma client (`src/lib/prisma.ts`) is imported everywhere.
- `middlewares/protect.ts` verifies the `Authorization: Bearer <jwt>` header and attaches `req.userId / req.username / req.userRole`. Every route except `/api/auth/*` is protected.
- **Role checks live in controllers** (compare `req.userRole` against `owner` / `organizer`, return `403`).
- Booking and cancellation run inside `prisma.$transaction` with an atomic `updateMany` claim, returning `409` on a lost race.

### Real-time messaging
- `src/socket.ts` holds a module-level Socket.IO singleton.
- Socket auth mirrors REST: the same JWT is verified from `socket.handshake.auth.token`.
- Clients `joinConversation`; the server authorizes membership before joining the `conversation:<id>` room.
- `sendMessage` persists then emits `newMessage` to everyone in that room.

### Frontend
- Auth state lives in `contexts/AuthContext.tsx` (`useAuth`); the user + token persist to `localStorage`.
- All API calls go through one axios instance (`services/api.ts`) that injects the bearer token and, on a `401`, clears the session and redirects to `/sign`.
- Routes: `/` (Home), `/sign` (combined sign-in/up), `/dashboard` (protected, role-aware nested routes).

---

## 🗂️ Project Structure

```
StadiumHub/
├── server/                     # Express + Prisma + Socket.IO API
│   ├── prisma/
│   │   ├── schema.prisma       # data model + migrations
│   │   └── migrations/
│   └── src/
│       ├── index.ts            # app entry: mounts routes, wires Socket.IO
│       ├── socket.ts           # Socket.IO singleton + auth
│       ├── routes/             # one file per domain
│       ├── controllers/        # request handlers + role checks
│       ├── middlewares/        # protect (JWT), uploadImages
│       ├── lib/                # prisma client, cloudinary config
│       └── generated/prisma/   # generated Prisma client (committed)
│
└── client/                     # React 19 + Vite SPA
    └── src/
        ├── pages/              # BrowseStadiums, MyStadiums, AddStadium,
        │                       # MyReservations, IncomingReservations,
        │                       # StadiumDetail, Messages, Sign, Home, ...
        ├── components/         # layout/, ui/, routing/, Home/
        ├── contexts/           # AuthContext
        ├── services/           # api.ts (axios), socket.ts
        └── utils/
```

> There is **no root-level package** — install and run `server/` and `client/` independently.

---

## 🗃️ Data Model

```
User (role: owner | organizer)
  └── owns → Stadium[]   (name, location, images[])
              └── has → Slot[]   (date, startTime, endTime, available)
                          └── has → Reservation[]   (status: confirmed | cancelled)

Conversation (unique per organizer + owner pair)
  └── has → Message[]   (body, read flag)
```
Deleting a stadium/slot cascades to its slots/reservations/messages; conversation participants are protected with `onDelete: Restrict`.

---

## 🛠️ Getting Started (local development)

### Prerequisites
- **Node.js 18+**
- A **PostgreSQL** database (local or hosted)
- A **Cloudinary** account (for image uploads)

### 1. Clone
```bash
git clone <repo-url>
cd StadiumHub
```

### 2. Backend setup
```bash
cd server
npm install
```

Create `server/.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"
JWT_SECRET="a-long-random-secret"
PORT=3000
FRONTEND_URL="http://localhost:5173"   # Vite dev server origin (CORS + Socket.IO)
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
```

Apply migrations and generate the client:
```bash
npx prisma migrate dev
npx prisma generate    # client is generated to src/generated/prisma/
npm run dev            # API on http://localhost:3000
```

### 3. Frontend setup
```bash
cd ../client
npm install
npm run dev            # app on http://localhost:5173
```

By default the client calls `http://localhost:3000/api`. To point at another backend, set a build-time env var:
```env
VITE_API_URL="https://your-backend.example.com/api"
```

---

## 📜 Scripts

### Server (`cd server`)
| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with hot reload (`tsx watch`) |
| `npm run build` | `prisma generate` |
| `npm start` | `prisma migrate deploy && tsx src/index.ts` (production) |
| `npx prisma migrate dev` | Create/apply migrations |
| `npx prisma studio` | Inspect the database in a browser |

### Client (`cd client`)
| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check then build (`tsc -b && vite build`) |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## 🔌 API Reference

Base URL: `/api`. All routes except `/api/auth/*` require `Authorization: Bearer <jwt>`.

### Auth — `/api/auth` (rate-limited)
| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/signup` | Create an account (`owner` or `organizer`) |
| `POST` | `/signin` | Log in, returns a JWT |

### Stadiums — `/api/stadiums`
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | List stadiums (organizer browse) |
| `GET` | `/owner` | List the current owner's stadiums |
| `GET` | `/:id` | Get one stadium |
| `POST` | `/` | Create a stadium *(owner)* |
| `PUT` | `/:id` | Update a stadium *(owner)* |
| `DELETE` | `/:id` | Delete a stadium *(owner)* |

### Slots — `/api/stadiums`
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/:stadiumId/slots` | List a stadium's slots |
| `GET` | `/:stadiumId/slots/owner` | List slots (owner view) |
| `POST` | `/:stadiumId/slots` | Create a slot *(owner)* |
| `DELETE` | `/:stadiumId/slots/:slotId` | Delete a slot *(owner)* |

### Reservations — `/api/reservations`
| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Reserve a slot *(organizer; atomic claim)* |
| `GET` | `/me` | The organizer's reservations |
| `GET` | `/owner` | Reservations on the owner's stadiums |
| `PATCH` | `/:id/cancel` | Cancel a reservation (frees the slot) |

### Conversations & Messages — `/api/conversations`
| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Start a conversation |
| `GET` | `/` | List my conversations (with ≥1 message) |
| `GET` | `/:id/messages` | Get messages in a conversation |
| `POST` | `/:id/messages` | Send a message (persist + emit) |
| `PATCH` | `/:id/read` | Mark messages as read |

### Uploads — `/api/uploads`
| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Upload up to 6 images *(owner)* → returns Cloudinary URLs |

### Socket.IO events
| Direction | Event | Payload |
| --- | --- | --- |
| client → server | `joinConversation` | `conversationId` |
| client → server | `sendMessage` | `{ conversationId, body }` |
| server → client | `newMessage` | the persisted message |

---

## ☁️ Deployment (Railway)

Three Railway services: **PostgreSQL** + **backend** (`server/`) + **frontend** (`client/`).

**Backend**
- `build` = `prisma generate`, `start` = `prisma migrate deploy && tsx src/index.ts`.
- `app.set("trust proxy", 2)` — Railway fronts the app with 2 proxy hops, so `express-rate-limit` keys on the real client IP.
- Env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (no trailing slash), `CLOUDINARY_URL`. **Do not set `PORT`** — Railway injects it.

**Frontend**
- Static Vite build served by `serve -s dist -l $PORT`.
- Env var: `VITE_API_URL` = backend URL including `/api` (build-time).

---

## 🔐 Security Notes

- Passwords are hashed with **bcrypt**; JWTs are signed with `JWT_SECRET`.
- Auth endpoints are **rate-limited per IP** (10 attempts / 15 min) and a global limiter guards the API.
- Role authorization is enforced **server-side** in controllers, not just in the UI.
- Image uploads are validated (image-only, ≤6 files, ≤5 MB each) and rejected for non-owners *before* buffering.
- Only `https://res.cloudinary.com/` image URLs are accepted when creating/updating stadiums.
