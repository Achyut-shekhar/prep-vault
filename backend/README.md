# PrepVault Backend

Node.js + Express backend for PrepVault.

## Environment

Add these keys in `backend/.env`:

- `PORT=5000`
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `CLIENT_URL=http://localhost:5173`
- `NODE_ENV=development`
- `GROQ_API_KEY=...`
- `GROQ_MODEL=llama-3.1-8b-instant`
- `AI_RATE_LIMIT_MAX=10`
- `AI_RATE_LIMIT_WINDOW_MS=60000`

## AI Endpoints

All AI endpoints require auth (`Authorization: Bearer <token>`).
AI endpoints are rate-limited per user and path.

### `POST /api/ai/extract`

Extracts clean article content from a URL.

Request body:

```json
{
	"url": "https://example.com/article"
}
```

Response includes `title`, `description`, `content`, `sourceUrl`, and `contentLength`.

### `POST /api/ai/notes/from-article`

Generates structured notes using Groq from either a URL or direct text.

Request body (URL mode):

```json
{
	"url": "https://example.com/article",
	"noteStyle": "detailed",
	"createTodos": true,
	"saveToVault": true,
	"vaultId": "<vault-id>"
}
```

Request body (direct text mode):

```json
{
	"articleTitle": "My article",
	"articleText": "...",
	"noteStyle": "exam-ready",
	"createTodos": false,
	"saveToVault": false
}
```

`noteStyle` supports: `concise`, `detailed`, `exam-ready`.
When `createTodos=true` with `saveToVault=true`, AI action items are added to that folder's to-do list.

Response:

- `article`: extracted/normalized article payload
- `notes`: structured AI notes (`summary`, `keyPoints`, `actionItems`, `tags`, `confidence`)
- `savedNote`: created vault note object when `saveToVault=true`, otherwise `null`

### `POST /api/ai/scrape/structured`

Scrapes and returns structured page data for automation workflows.

Request body:

```json
{
	"url": "https://example.com/page"
}
```

Response includes:

- `title`, `description`
- `headings` (h1-h3)
- `links` (absolute URLs + anchor text)
- `textPreview`
- `contentLength`

## AI Usage Logging

Every AI request writes a log record in MongoDB with:

- user id
- endpoint
- status code and success flag
- request duration
- source URL (when provided)
- model (for generation requests)
