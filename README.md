# 👑 King Mode

> An AI-powered Email & Calendar Operating System — built for the Corsair Hackathon

King Mode is a lightning-fast, keyboard-driven productivity platform that transforms Gmail and Google Calendar into an autonomous, context-aware AI assistant ecosystem. It features a traditional workspace UI and a cinematic "KING MODE" AI command center that executes complex multi-step operations in natural language.

---

## ✨ Features

- **Sovereign AI Executor** — Chat with an AI that can read emails, draft replies, create calendar events, and send emails autonomously in a single command
- **Unified Inbox** — Full Gmail inbox with pagination, thread view, starring, archiving, and compose
- **Google Calendar** — Week/month view with event creation, editing, and attendee management
- **Real-time Updates** — Server-Sent Events (SSE) push live changes to the UI when webhooks fire — no page refreshes
- **Keyboard-First** — Global shortcuts (`Shift+I` inbox, `Shift+K` King Mode, `Shift+C` calendar, `Shift+P` compose) for power users
- **Multi-step AI Tool Calling** — The AI loops over Corsair MCP tools autonomously until the task is done (up to 20 steps)
- **Reminder System** — Set follow-up reminders on emails; a Vercel cron fires every 5 minutes to check them
- **MCP Server** — A full per-tenant Model Context Protocol server powering the AI's tool access

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) + TypeScript |
| **Auth** | Clerk (Google OAuth) |
| **Database** | PostgreSQL via Neon + Drizzle ORM |
| **Integrations** | Corsair (Gmail + Google Calendar bridge) |
| **AI** | Vercel AI SDK — OpenRouter / OpenAI / Gemini |
| **AI Protocol** | Model Context Protocol (MCP) via `@corsair-dev/mcp` |
| **Realtime** | Server-Sent Events (SSE) |
| **State** | TanStack Query v5 |
| **Styling** | Tailwind CSS v4 |
| **Deploy** | Vercel |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd king_mode
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Required variables:

```bash
# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database (Neon Postgres)
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Corsair — get from https://corsair.dev → Instances
CORSAIR_API_KEY=ch_...
CORSAIR_INSTANCE_ID=<your-instance-id>
CORSAIR_KEK=<your-kek-hex>

# AI Provider (OpenRouter recommended)
OPENROUTER_API_KEY=sk-or-v1-...

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# MCP (same as app URL in dev)
MCP_SERVER_URL="http://localhost:3000/api/mcp"
```

### 3. Set Up the Database

```bash
pnpm db:generate   # generate migrations from schema
pnpm db:push       # apply schema to your Neon database
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
king_mode/
├── corsair.ts                    # Corsair client init (gmail + googlecalendar plugins)
├── drizzle.config.ts             # Drizzle ORM config
├── vercel.json                   # Cron: /api/cron/check-reminders every 5 min
│
└── src/
    ├── proxy.ts                  # Clerk middleware — protects all routes except public ones
    │
    ├── app/
    │   ├── layout.tsx            # Root layout — ClerkProvider, QueryProvider, ToastProvider
    │   ├── page.tsx              # Landing page
    │   ├── (auth)/               # Sign-in / Sign-up pages (Clerk components)
    │   ├── (app)/                # Protected app shell
    │   │   ├── email/            # Inbox, Sent, Drafts, Reminders
    │   │   ├── calendar/         # Calendar view
    │   │   ├── king/             # KING MODE — full-screen AI command center
    │   │   └── settings/         # User settings
    │   └── api/
    │       ├── chat/             # POST — AI streaming endpoint (MCP + OpenRouter)
    │       ├── mcp/              # MCP server — per-tenant tool execution
    │       ├── emails/           # Gmail CRUD via Corsair
    │       ├── calendar/         # Calendar CRUD via Corsair
    │       ├── sse/              # GET — SSE stream for realtime updates
    │       ├── connect/          # GET — OAuth connect flow (Gmail / Calendar)
    │       ├── webhooks/corsair/ # POST — Corsair webhook receiver
    │       ├── cron/             # Vercel cron routes
    │       └── threads/          # Email thread fetching
    │
    ├── components/               # UI components
    │   ├── king/                 # King Mode chat UI (ChatInput, ChatMessage, WelcomeScreen)
    │   ├── Calendar.tsx          # FullCalendar integration
    │   ├── EmailList.tsx         # Paginated email list
    │   ├── ComposeModal.tsx      # Email compose/reply modal
    │   └── ...
    │
    └── lib/
        ├── ai/                   # System prompt builder
        ├── corsair/              # Corsair tenant client, hasPlugin, ensureTenant
        ├── db/                   # Drizzle client + schema (users, reminders, corsair tables)
        ├── email/                # Email parsing utilities
        ├── hooks/                # TanStack Query hooks (useEmails, useCalendar, etc.)
        ├── mcp.ts                # MCP server factory + session management
        ├── sse/                  # SSE client manager (in-memory)
        └── validations/          # Zod schemas
```

---

## 🔄 Realtime Architecture

```
Corsair detects Gmail/Calendar change
  → POST /api/webhooks/corsair
  → Resolves tenantId from email address
  → Calls processWebhook(corsair, ...)
  → broadcastRefresh() → SSE push to browser
  → TanStack Query invalidates → UI updates instantly
```

---

## 🤖 KING MODE — AI Agent Loop

```
User types command
  → POST /api/chat (SSE streaming response)
  → Builds system prompt (timezone, connected integrations)
  → Creates Vercel AI MCP client → /api/mcp
  → streamText() with MCP tools (max 20 steps)
  → AI calls tools: gmail.api.*, googlecalendar.api.*, gmail_send_plain
  → Loops until task complete
  → Streams response back token by token
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Shift + I` | Jump to Inbox |
| `Shift + K` | Open King Mode AI |
| `Shift + C` | Jump to Calendar |
| `Shift + P` | Compose new email |

---

## 🌐 Deployment (Vercel)

1. Connect your GitHub repo to Vercel
2. Set all environment variables in the Vercel dashboard (see list above)
3. Ensure `NEXT_PUBLIC_APP_URL` points to your production domain
4. Deploy — the cron job in `vercel.json` is automatically picked up

> **Note:** After deploy, update your Corsair webhook URL and Google OAuth redirect URI to your production domain.

---

## 📋 Available Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:generate  # Generate Drizzle migrations
pnpm db:push      # Apply schema to database
pnpm db:studio    # Open Drizzle Studio (database GUI)
```

---

## 🏆 Built for the Corsair Hackathon

King Mode showcases Corsair's multi-tenant Gmail and Google Calendar integration, demonstrating autonomous AI tool calling via MCP, real-time webhook-driven UI updates, and a high-polish keyboard-first productivity interface.
