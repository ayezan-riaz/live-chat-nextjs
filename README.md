# Live Chat – README

This repo contains a real‑time, WhatsApp‑style chat built with **NestJS + TypeORM + Socket.IO** (backend) and **Next.js 15 + Tailwind v4** (frontend). It supports:

* Phone‑number based users
* Private chats (auto create on first message)
* Message history via REST
* Presence (online/last seen)
* Typing indicator
* **Live sidebar updates** for new chats & users via Socket.IO (`chatUpsert`, `userUpsert`)

---

## Backend (NestJS + TypeORM + Socket.IO)

### Requirements

* Node.js 18+
* MySQL 8+
* npm or pnpm

### Quick Start

```bash
cd backend
npm install
cp .env.example .env
# edit .env to match your MySQL
npm run start:dev
```

The server listens on **[http://localhost:3001](http://localhost:3001)** by default.

### Environment

Create **backend/.env** (or use your process manager to set envs):

```ini
PORT=3001
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=livechat_db
CORS_ORIGIN=http://localhost:3000
```

> Your current code has TypeORM config inline. Either keep it (and update values there) or refactor to `forRootAsync` to use these envs.

### Scripts

```json
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "build": "nest build",
  "lint": "eslint ."
}
```

### Project Structure (key files)

```
backend/
 ├─ src/
 │   ├─ entities/
 │   │   ├─ user.entity.ts
 │   │   ├─ chat.entity.ts
 │   │   ├─ message.entity.ts
 │   │   └─ chat-participant.entity.ts
 │   ├─ gateways/
 │   │   └─ chat.gateway.ts         # Socket.IO gateway
 │   ├─ services/
 │   │   ├─ user.service.ts
 │   │   └─ chat.service.ts
 │   ├─ controller/
 │   │   ├─ user.controller.ts
 │   │   └─ chat.controller.ts
 │   └─ app.module.ts
 ├─ .env.example
 └─ ...
```

### Database Schema (TypeORM entities)

* **users**: id, phoneNumber (unique), name, isOnline, lastSeen, createdAt, updatedAt
* **chats**: id, chatName?, chatType ('private'), lastMessageTime, createdAt, updatedAt
* **messages**: id, content, messageType ('text' | 'image' | 'file'), isRead, createdAt, senderId, chatId
* **chat\_participants**: id, userId, chatId, joinedAt

> `synchronize: true` is enabled for development; switch to migrations for production.

### REST API

Base URL: `http://localhost:3001`

**Users**

* `POST /users` — create user

  ```json
  { "phoneNumber": "+1234567890", "name": "Alice" }
  ```
* `GET /users` — list all users
* `GET /users/:phoneNumber` — get by phone

**Chats**

* `GET /chats/user/:phoneNumber` — list chats for user
* `GET /chats/:chatId/history?limit=50` — latest N messages (DESC in DB, reversed on emit)

### Socket.IO Events

**Client → Server**

* `userOnline` `{ phoneNumber }`
* `sendMessage` `{ content, senderPhoneNumber, receiverPhoneNumber, messageType? }`
* `joinChat` `{ chatId, phoneNumber }`
* `typing` `{ chatId, phoneNumber, isTyping }`

**Server → Client**

* `onlineStatus` `{ status: 'success' | 'error', user?, message? }`
* `messageReceived` `{ id, content, messageType, createdAt, sender: {id,name,phoneNumber}, chatId }`
* `chatHistory` `Message[]` (reversed to chronological)
* `userTyping` `{ userId, userName, isTyping }`
* `userOnline` `{ userId, phoneNumber, name }`
* `userOffline` `{ userId }`
* **`chatUpsert`** `{ chatId, chatType, otherUser, lastMessage, lastMessageTime }`
* **`userUpsert`** `{ id, name, phoneNumber, isOnline, lastSeen, createdAt, updatedAt }`

> `chatUpsert` is emitted after saving a message to **both** participants so your sidebar inserts/updates the chat immediately (no refresh).

### CORS

The gateway enables CORS for `http://localhost:3000`. Update `CORS_ORIGIN` when deploying.

### Troubleshooting

* **Cannot connect to DB**: verify MySQL is running, creds correct, and DB exists (`CREATE DATABASE livechat_db;`).
* **CORS errors**: ensure frontend origin matches backend CORS config.
* **No live updates**: confirm Socket.IO connection in browser console, and check that events `chatUpsert`/`userUpsert` are emitted (see gateway code).
* **TS/paths**: if you moved files, fix imports and restart `start:dev`.

---

## Frontend (Next.js 15 + Tailwind v4 + Socket.IO Client)

### Requirements

* Node.js 18+
* Next.js 15.x

### Quick Start

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

App runs at **[http://localhost:3000](http://localhost:3000)**.

### Environment

Create **frontend/.env.local**:

```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

> Update your socket service to use `process.env.NEXT_PUBLIC_SOCKET_URL` instead of a hardcoded URL.

### Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

### Project Structure (key files)

```
frontend/
 ├─ src/app/
 │   ├─ layout.tsx                 # imports ./globals.css
 │   ├─ globals.css                # Tailwind v4 tokens for WhatsApp theme
 │   ├─ context/ChatContext.tsx    # global chat state + socket handlers
 │   ├─ services/
 │   │   ├─ api.ts                 # axios REST client
 │   │   └─ socket.ts              # Socket.IO client wrapper
 │   ├─ components/
 │   │   ├─ ChatSidebar.tsx
 │   │   └─ ChatWindow.tsx
 │   └─ pages / routes as needed
 └─ types/index.ts
```

### Tailwind v4 Setup

**postcss.config.mjs**

```js
export default { plugins: ["@tailwindcss/postcss"] };
```

**app/layout.tsx**

```tsx
import './globals.css';
```

**app/globals.css** (WhatsApp theme tokens)

```css
@import "tailwindcss";
@theme inline {
  --color-whatsapp-bg: #f0f2f5;
  --color-whatsapp-sidebar: #ffffff;
  --color-whatsapp-chat: #f0f2f5;
  --color-whatsapp-input: #e9edef;
  --color-whatsapp-message: #dff7c3;
  --color-whatsapp-received: #ffffff;
  --color-wp-text: #111b21;
  --color-wp-border: #d1d7db;
}
@media (prefers-color-scheme: dark) {
  @theme inline {
    --color-whatsapp-bg: #0b141a;
    --color-whatsapp-sidebar: #202c33;
    --color-whatsapp-chat: #0b141a;
    --color-whatsapp-input: #2a3942;
    --color-whatsapp-message: #005c4b;
    --color-whatsapp-received: #202c33;
    --color-wp-text: #e9edef;
    --color-wp-border: #2a3942;
  }
}
@layer base {
  html, body, #__next { height: 100%; }
  body { @apply bg-whatsapp-bg text-wp-text antialiased; }
}
@layer components {
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .wp-divider { border-color: var(--color-wp-border); }
}
```

### Key Files

* **services/socket.ts** — wraps Socket.IO client; registers listeners for:

  * `messageReceived`, `userOnline`, `userOffline`, `chatHistory`, `userTyping`, **`chatUpsert`**, **`userUpsert`**
* **context/ChatContext.tsx** — global reducer with actions:

  * `UPSERT_CHAT` (insert/sort chats when `chatUpsert` arrives)
  * `UPSERT_USER` (update All Users when `userUpsert` arrives)
  * `SET_MESSAGES`, `ADD_MESSAGE`, presence & typing setters
* **components/ChatSidebar.tsx** — subscribes to `userUpsert` to keep All Users fresh
* **components/ChatWindow\.tsx** — shows messages, typing, input

### How Live Sidebar Works

1. User sends/receives a message.
2. Backend saves it and emits **`chatUpsert`** to both users with the sidebar shape.
3. Frontend `ChatContext` handles `chatUpsert` → **upserts** the chat and sorts by `lastMessageTime`.
4. If user was chatting in a temp chat (`chatId: 0`), it promotes to the real `chatId` and joins that room.
5. New users/online status are pushed via **`userUpsert`** and presence events.

### Troubleshooting

* **TS error `Cannot find name 'socketService'`**: import it at the top of files that use it:

  ```ts
  import socketService from '../services/socket';
  ```
* **No styles**: ensure `layout.tsx` imports `./globals.css` and you’re on Tailwind v4 with `@tailwindcss/postcss`.
* **No live updates**: check browser console for Socket.IO connection; verify server is emitting `chatUpsert`/`userUpsert`.
* **CORS**: match `NEXT_PUBLIC_SOCKET_URL` + backend CORS.

### Build & Run (prod)

```bash
npm run build
npm run start
```

Set envs for both frontend and backend on your host or platform.

---

## Testing Guide (Manual)

1. Start backend (`npm run start:dev`) and frontend (`npm run dev`).
2. Register two users (phone numbers A and B) or use existing ones.
3. Open two browser windows and log in as A and B.
4. From A → send a message to B.
5. Observe:

   * A and B both receive `messageReceived`.
   * Sidebars on both windows **immediately** show the chat via `chatUpsert`.
   * Presence toggles when you close a tab/window (B should get `userOffline`).
6. Start typing in one window → other window shows `typing`.

---

## Notes for Production

* Disable `synchronize: true` and use migrations.
* Use HTTPS and secure cookies if you add auth.
* Validate DTOs (`class-validator`, `class-transformer`).
* Rate limit REST and throttle socket connections if exposed publicly.
* Consider namespaces/rooms per feature if you add groups, attachments, etc.

---

## Change Log (custom events)

* **Added `chatUpsert`** (server emits after saving message; frontend upserts chat list)
* **Added `userUpsert`** (server emits on connect/disconnect; frontend updates All Users)

Happy shipping! 🚀
