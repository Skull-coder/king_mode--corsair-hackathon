# 👑 King Mode

> An AI-powered Email & Calendar Operating System — built for the Corsair Hackathon
> 
> 🔴 **Live Demo**: [https://kingmode.skullcoder.dev](https://kingmode.skullcoder.dev)

King Mode is a lightning-fast, keyboard-driven productivity platform that transforms Gmail and Google Calendar into an autonomous, context-aware AI assistant ecosystem. It features a traditional workspace UI and a cinematic "KING MODE" AI command center that executes complex multi-step operations in natural language.

---

## ✨ Features

- **Sovereign AI Executor** — Chat with an AI that can read emails, draft replies, create calendar events, and send emails autonomously in a single command. **Bring Your Own Key (BYOK)** to use your preferred LLM!
- **Unified Inbox** — View your **Inbox, Sent messages, and Drafts**. Read threads, and **reply to messages** directly.
- **Google Calendar** — Work just like you do in Google Calendar! Features week/month view, event creation, editing, and attendee management.
- **Reminder System** — Set a reminder on an email so you know if you got replied to or not after a given period; a Vercel cron fires every 5 minutes to check them.
- **Floating Action Button (FAB)** — Quickly send an email or create an event from anywhere in the app.
- **Thread to Event** — In `/email/inbox/[threadId]` or `/email/sent/[threadId]`, use the three-dot menu to create an event by copying the title of the message to the event. *(Coming soon: AI integration to automatically set the time and title by analyzing the message).*
- **Real-time Updates** — Server-Sent Events (SSE) push live changes to the UI when webhooks fire — no page refreshes.
- **Keyboard-First** — Extensive global shortcuts for power users (see the list below).
- **Multi-step AI Tool Calling** — The AI loops over Corsair MCP tools autonomously until the task is done (up to 20 steps).
- **MCP Server** — A full per-tenant Model Context Protocol server powering the AI's tool access.

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

The codebase is structured to elegantly separate concerns between the UI app shell, real-time sync, and the AI/MCP functionality. The `src/app` directory handles all Next.js App Router routing, where `(app)` contains the authenticated workspace. The `api` routes securely process external webhook updates and AI tool calls. `src/lib` contains the core business logic, including database setup, Corsair MCP handling, and custom hooks.

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

| Category | Shortcut | Action |
|---|---|---|
| **Global Navigation** | `Shift + X` | Go to Settings |
| | `Shift + I` | Jump to Inbox |
| | `Shift + S` | Go to Sent |
| | `Shift + D` | Go to Drafts |
| | `Shift + R` | Go to Reminders |
| | `Shift + C` | Jump to Calendar |
| | `Shift + K` | Open King Mode AI |
| **Email & Compose** | `Shift + P` | Compose new email |
| | `Ctrl + Enter` | Send Email / Reply |
| | `Left Arrow` | Switch to Draft Tab |
| **Calendar & Event** | `Ctrl + Enter` | Create Event / Send |
| | `Right Arrow` | Switch to Event Tab |
| | `Escape` | Close Active Modals |
| **King Mode Chatbot** | `Enter` | Send AI Prompt |
| | `Shift + Enter` | Insert Newline |

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
