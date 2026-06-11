# Companion — API Reference

All API routes live under `app/api/` in the Next.js App Router. They run server-side only.

**Base URL (development):** `http://localhost:3000`

---

## Overview

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/generate` | Generate a new message |
| `GET` | `/api/save` | Fetch recent message history |
| `POST` | `/api/save` | Save a copied message |
| `GET` | `/api/settings` | Read recipient preferences |
| `POST` | `/api/settings` | Save recipient preferences |

No authentication. No rate limiting (local MVP).

---

## `POST /api/generate`

Generates one thoughtful message using the full pipeline: context → prompt → LLM → parse → similarity check.

### Request

- **Method:** `POST`
- **Body:** None
- **Headers:** None required

### Prerequisites

Recipient settings must exist (`POST /api/settings` completed). Otherwise returns `400`.

### Success response — `200 OK`

```json
{
  "message": "I hope today gives you a few quiet moments to breathe…",
  "theme": "tenderness",
  "tone": "affectionate",
  "context": {
    "day": "Thursday",
    "timeOfDay": "afternoon",
    "weather": {
      "condition": "partly cloudy",
      "temp": "28°C",
      "mood": "quiet"
    },
    "recentThemes": ["gratitude", "admiration"]
  },
  "tooSimilar": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Generated message text |
| `theme` | string | One of: gratitude, admiration, encouragement, tenderness, playfulness, reflection |
| `tone` | string | One of: warm, poetic, teasing, supportive, calm, affectionate |
| `context` | object | Situational context used for generation (also drives UI weather capsule) |
| `tooSimilar` | boolean | `true` if message still closely matches a recent one after one retry |

When `tooSimilar` is `true`, the message is still returned — the UI shows a warning and suggests regenerating.

### Error responses

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "error": "Please set up who you're writing for first." }` | No settings in database |
| `500` | `{ "error": "Failed to parse LLM response as JSON" }` | LLM output was not valid JSON |
| `500` | `{ "error": "Ollama generation failed…" }` | LLM provider error (Ollama down, missing model, API key missing, etc.) |

### Example

```bash
curl -X POST http://localhost:3000/api/generate
```

---

## `GET /api/save`

Returns the most recent saved messages for the history panel.

### Request

- **Method:** `GET`
- **Body:** None

### Success response — `200 OK`

```json
{
  "messages": [
    {
      "id": 3,
      "sent_at": "2026-06-11T17:30:00.000Z",
      "message_text": "Thinking about you this afternoon…",
      "theme": "gratitude",
      "tone": "warm"
    }
  ]
}
```

- Ordered newest first.
- Limited to **7** messages server-side.
- Empty array if nothing has been copied yet.

### Example

```bash
curl http://localhost:3000/api/save
```

---

## `POST /api/save`

Persists a message when the user copies it to the clipboard.

### Request

- **Method:** `POST`
- **Content-Type:** `application/json`

```json
{
  "message_text": "The full message string",
  "theme": "gratitude",
  "tone": "warm"
}
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `message_text` | Yes | string | Message body |
| `theme` | No | string | Theme label from generation |
| `tone` | No | string | Tone label from generation |

### Success response — `200 OK`

```json
{
  "ok": true
}
```

### Error responses

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "error": "message_text is required" }` | Missing or invalid `message_text` |
| `500` | `{ "error": "Save failed" }` | Database error |

### Example

```bash
curl -X POST http://localhost:3000/api/save \
  -H "Content-Type: application/json" \
  -d '{"message_text":"Hello","theme":"gratitude","tone":"warm"}'
```

---

## `GET /api/settings`

Reads the current recipient preferences.

### Request

- **Method:** `GET`
- **Body:** None

### Success response — `200 OK`

```json
{
  "settings": {
    "recipient_gender": "female",
    "recipient_context": "We've been together 3 years. She loves morning walks.",
    "updated_at": "2026-06-11T16:00:00.000Z"
  }
}
```

If no settings exist:

```json
{
  "settings": null
}
```

The UI treats `null` as "show GET STARTED onboarding overlay."

### Example

```bash
curl http://localhost:3000/api/settings
```

---

## `POST /api/settings`

Creates or updates recipient preferences. Always upserts the single settings row.

### Request

- **Method:** `POST`
- **Content-Type:** `application/json`

```json
{
  "recipient_gender": "female",
  "recipient_context": "We've been together 3 years."
}
```

| Field | Required | Type | Allowed values |
|-------|----------|------|----------------|
| `recipient_gender` | Yes | string | `"female"` or `"male"` |
| `recipient_context` | No | string | Free text (defaults to `""`) |

### Success response — `200 OK`

```json
{
  "ok": true,
  "settings": {
    "recipient_gender": "female",
    "recipient_context": "We've been together 3 years.",
    "updated_at": "2026-06-11T16:00:00.000Z"
  }
}
```

### Error responses

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ "error": "recipient_gender must be female or male" }` | Invalid gender value |
| `500` | `{ "error": "Save failed" }` | Database error |

### Example

```bash
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"recipient_gender":"male","recipient_context":"He works long hours."}'
```

---

## Error handling in the UI

The client (`app/page.tsx`) surfaces API errors in context:

| Endpoint | UI behavior |
|----------|-------------|
| `POST /api/generate` | Red error text below left-panel content; returns to `landing` state |
| `POST /api/settings` | Red error in onboarding or settings modal |
| `POST /api/save` | Silent failure (clipboard copy still succeeds) |
| `GET /api/save` | Silent failure (history panel stays empty) |
| `GET /api/settings` | On failure, shows onboarding overlay |

### UI integration notes

- **History panel** — `GET /api/save` on page load and after each successful copy; opened via **HISTORY** in the fixed nav.
- **Settings** — `GET /api/settings` on mount; `POST /api/settings` from onboarding (`LET'S GO`) or settings modal (`SAVE`).
- **Generate** — `POST /api/generate` transitions left panel to `generating`, then `result` with `context` driving the weather capsule.
- **tooSimilar** — Soft champagne warning below tags; message still displayed.

---

## TypeScript interfaces

These mirror the shapes returned by the API (defined in `app/page.tsx` and `lib/db.ts`):

```typescript
interface RecipientSettings {
  recipient_gender: "female" | "male";
  recipient_context: string;
  updated_at: string;
}

interface Message {
  id: number;
  sent_at: string;
  message_text: string;
  theme: string | null;
  tone: string | null;
}

interface AppContext {
  day: string;
  timeOfDay: string;
  weather: { condition: string; temp: string; mood: string };
  recentThemes: string[];
}

interface GenerateResponse {
  message: string;
  theme: string;
  tone: string;
  context: AppContext;
  tooSimilar: boolean;
}
```
