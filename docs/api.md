# TheJury public API (v1)

A small REST API for creating polls (including session-scheduling polls) and
reading their results — enough for a partner such as **Tabletop Chronicles** to
embed a scheduling poll on a campaign page and read the outcome.

- **Base URL:** `https://thejury.app/api/v1`
- **Format:** JSON in, JSON out. Success responses wrap the payload in `data`.
- **Availability:** API access is a **Pro** feature.

## Authentication

Every request needs a per-user API key in the `Authorization` header:

```
Authorization: Bearer jury_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Create and revoke keys under **Profile → API keys** (Pro). The raw key is shown
once at creation; only a hash is stored. Each key has **scopes**:

| Scope | Grants |
|---|---|
| `polls:read` | List your polls and read a poll's results. |
| `polls:write` | Create polls. |

Keys act on behalf of the owning account: you can only read and write **your
own** polls.

## Rate limits

Per-IP and per-user token buckets apply (roughly 30–60 reads/min and 10–20
writes/min). Over the limit returns `429`.

## Endpoints

### `GET /polls`
List your polls (requires `polls:read`).

```bash
curl https://thejury.app/api/v1/polls \
  -H "Authorization: Bearer $JURY_KEY"
```
```json
{ "data": [ { "id": "…", "code": "AB12CD", "question": "…", "is_active": true,
             "allow_multiple": false, "created_at": "…", "total_votes": 12 } ] }
```

### `POST /polls`
Create a poll (requires `polls:write`).

Body:

| Field | Type | Notes |
|---|---|---|
| `question` | string | Required. |
| `options` | string[] | Required, 2+ non-empty items. |
| `description` | string | Optional. |
| `allow_multiple` | boolean | Optional (default `false`). Use `true` for availability/scheduling polls. |
| `close_at` | string | Optional ISO 8601 timestamp; voting auto-closes then. |
| `closes_in_hours` | number | Optional alternative to `close_at`. |

**Create a session-scheduling poll** (multi-select availability, closes in 3 days):

```bash
curl -X POST https://thejury.app/api/v1/polls \
  -H "Authorization: Bearer $JURY_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Which night for Session 12?",
    "options": ["Fri 19 Sep", "Fri 26 Sep", "Fri 3 Oct"],
    "allow_multiple": true,
    "closes_in_hours": 72
  }'
```
```json
{ "data": { "id": "8f3…", "code": "AB12CD", "question": "Which night for Session 12?",
            "allow_multiple": true, "has_time_limit": true,
            "end_date": "2026-09-15T04:00:00.000Z", "is_active": true,
            "created_at": "…", "total_votes": 0 } }
```

### `GET /polls/{id}`
Read a poll and its live results (requires `polls:read`). `{id}` is the poll's
`id` from the create response.

```bash
curl https://thejury.app/api/v1/polls/8f3… \
  -H "Authorization: Bearer $JURY_KEY"
```
```json
{ "data": {
    "id": "8f3…", "code": "AB12CD", "question": "Which night for Session 12?",
    "is_active": true, "end_date": "…", "total_votes": 14,
    "results": [
      { "option_id": "…", "option_text": "Fri 19 Sep", "option_order": 1, "vote_count": 9 },
      { "option_id": "…", "option_text": "Fri 26 Sep", "option_order": 2, "vote_count": 4 },
      { "option_id": "…", "option_text": "Fri 3 Oct",  "option_order": 3, "vote_count": 1 }
    ] } }
```

## Embedding (Tabletop Chronicles)

1. `POST /polls` to create the scheduling poll; keep the returned `id` and `code`.
2. Embed the vote widget on the campaign page:
   ```html
   <iframe src="https://thejury.app/embed/AB12CD" width="100%" height="420"
           style="border:0" title="Session scheduling poll"></iframe>
   ```
3. Poll `GET /polls/{id}` to show the winning night, or link players to
   `https://thejury.app/results/AB12CD`.

## Errors

Errors return `{ "error": "message" }` with an appropriate status:

| Status | Meaning |
|---|---|
| `400` | Invalid body (missing `question`, fewer than 2 `options`, bad `close_at`). |
| `401` | Missing or invalid API key. |
| `403` | Key lacks the required scope. |
| `404` | Poll not found (or not yours). |
| `429` | Rate limited. |
| `500` | Server error. |
