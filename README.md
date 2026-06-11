# Companion

A personal message drafting app that helps you write thoughtful daily messages for someone you love.

**Workflow:** Open → Set up who you're writing for → Generate → Review → Copy → Paste into WhatsApp manually.

Companion is a **writing companion**, not a messaging platform. There is no WhatsApp integration, scheduling, automation, or authentication.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ABOUT.md](docs/ABOUT.md) | What Companion is, what it does, and how it looks and feels |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical reference — layers, files, APIs, data flow |
| [docs/DATABASE.md](docs/DATABASE.md) | SQLite schema, tables, and query patterns |
| [docs/API.md](docs/API.md) | HTTP endpoints, request/response shapes, error codes |

---

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Ollama](https://ollama.com/) running locally (default LLM provider)

### Install

```bash
npm install
cp .env.example .env.local
```

### Start Ollama

```bash
ollama serve
ollama pull qwen3:4b
```

Other models work via `OLLAMA_MODEL` in `.env.local` (e.g. `llama3`, `phi4`, `mistral`).

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If you see a stale-build error (`Cannot find module './xxx.js'`), clear the cache first:

```bash
npm run clean
npm run dev
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `ollama` | `ollama`, `anthropic`, or `openai` |
| `OLLAMA_MODEL` | `qwen3:4b` | Ollama model name |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API host |
| `ANTHROPIC_API_KEY` | — | Required when `LLM_PROVIDER=anthropic` |
| `OPENAI_API_KEY` | — | Required when `LLM_PROVIDER=openai` |

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (dark graphite design system) |
| Fonts | Unbounded, DM Sans, Space Mono, Cormorant Garamond (via `next/font`) |
| Database | better-sqlite3 → `./companion.db` |
| Primary AI | Ollama (`ollama` npm package) |
| Optional AI | `@anthropic-ai/sdk`, `openai` |

**Intentionally excluded:** Prisma, ORMs, LangChain, vector DBs, embeddings, auth, Docker, UI component libraries (shadcn, framer-motion, etc.).

---

## Project structure

```
companion/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   # POST — message generation pipeline
│   │   ├── save/route.ts       # GET history · POST save on copy
│   │   └── settings/route.ts   # GET/POST recipient preferences
│   ├── fonts/                  # Local font files (if any)
│   ├── globals.css             # Design tokens, animations, utilities
│   ├── layout.tsx              # Root layout, fonts, metadata
│   └── page.tsx                # Single-page UI (client component)
├── lib/
│   ├── db.ts                   # SQLite access layer
│   ├── context.ts              # Weather + time context builder
│   ├── similarity.ts           # TF-IDF duplicate detection
│   └── llm.ts                  # LLM provider abstraction (single entry)
├── companion.db                # SQLite database (created at runtime)
├── .env.example
├── next.config.mjs             # better-sqlite3 + Unsplash image remotePatterns
├── tailwind.config.ts          # Graphite / bronze / champagne tokens
└── docs/                       # Detailed documentation
```

---

## How it works (summary)

1. **First visit** — User sets recipient gender (Her/Him) and optional personal context. Saved to SQLite `settings` table.
2. **Generate** — `POST /api/generate` builds live context (Accra weather, time of day, recent themes), merges recipient settings into a prompt, calls `generateMessage()` in `lib/llm.ts`, parses JSON, checks similarity against history, returns the message.
3. **Copy** — User copies to clipboard; client silently `POST /api/save` to persist the message.
4. **History** — `GET /api/save` returns the last 7 saved messages for the slide-over panel.

All LLM calls go through **one function**: `generateMessage()` in `lib/llm.ts`. Nothing else talks to Ollama directly.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the complete breakdown.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run clean` | Delete `.next` build cache |
| `npm run lint` | ESLint |

---

## License

Private project — local use.
