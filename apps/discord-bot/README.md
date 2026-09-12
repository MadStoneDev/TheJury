# TheJury Discord bot

Slash-command bot (`/jury`) that creates and runs polls backed by TheJury's
database. Polls made in Discord appear in the linked account's dashboard and at
`thejury.app/results/<code>`.

## Commands

| Command | What it does |
|---|---|
| `/jury link` | Generates a 15-minute code; enter it at `thejury.app/link-discord` (signed in) to attach the server to your account. |
| `/jury create title:<q> options:<a,b,c> [close:2h] [multi:true]` | Posts a poll card with a vote button per option and a **View full results** link. `close` accepts `2h` / `24h` / `7d`; `multi` allows multiple selections. |
| `/jury schedule title:<q> [dates:<Fri 19 Sep, Fri 26 Sep>]` | Availability poll (multi-select). With no `dates`, proposes the next 4 Fridays. |
| `/jury results code:<ABC123>` | Shows the current tally for a poll code (ephemeral). |

Votes are stored against `discord:<userId>` (one vote per Discord user per poll;
multi-select toggles). The poll message edits itself with live counts as people
vote.

## Prerequisites

1. **A TheJury Supabase** with migration `015_discord.sql` applied
   (`discord_links`, `discord_link_codes`, `discord_poll_messages`).
2. **A Discord application** — https://discord.com/developers/applications:
   - Create the app, add a **Bot**, copy the **token** → `DISCORD_TOKEN`.
   - Copy the **Application ID** → `DISCORD_CLIENT_ID`.
   - No privileged gateway intents are required (the bot only uses `Guilds`).
   - OAuth2 → URL Generator: scopes `bot` + `applications.commands`; bot
     permissions **Send Messages** + **Embed Links**. Use that URL to invite it.

## Setup

```bash
cd apps/discord-bot
cp .env.example .env      # fill in the values
npm install
npm run register          # register the /jury command (global; ~1h to propagate)
npm start                 # run the bot (uses tsx; keep this process alive)
npm run typecheck         # optional: type-check without running
```

`register` only needs re-running when the command definition changes.

## Environment variables

| Var | Purpose |
|---|---|
| `DISCORD_TOKEN` | Bot token. Secret. |
| `DISCORD_CLIENT_ID` | Application ID, for command registration. |
| `SUPABASE_URL` | TheJury Supabase URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service role** key — the bot writes for many users and manages the `discord_*` tables (bypasses RLS). Never expose client-side. |
| `THEJURY_URL` | Public site URL for result links and the link page (default `https://thejury.app`). |

## Hosting

The bot is a long-running Node process (a gateway websocket), **not** serverless.
Host it anywhere that keeps a process alive:

- **Railway / Render / Fly.io / a small VPS**: run `npm install` then
  `npm start` (or `npm run register && npm start` on first deploy). Set the env
  vars in the host's dashboard. Add a restart-on-crash policy.
- Only one instance should run at a time (a second gateway connection with the
  same token will conflict).
- Logs go to stdout.

## top.gg listing requirements

Before listing at https://top.gg:

- The bot must be **public** and invitable (OAuth2 invite URL above).
- Provide: a short + long description, an avatar/icon, tags, and a support
  server invite.
- Prefix is **slash commands** (`/jury`); note that in the listing.
- Add the top.gg **API token** if you want to post server-count stats, and set
  up the top.gg webhook for vote rewards (optional; not required to list).
- Follow top.gg's guidelines: no requiring payment to use core features, a
  working invite, and the bot online during review.
- Verified bots (75+ servers) can request the verified badge; larger bots need
  message-content intent justification — this bot does **not** use message
  content, which simplifies verification.

## Suggested top.gg listing copy

**Short description**
> Create polls and find a night everyone can make — vote in one tap, results update live. `/jury create`, `/jury schedule`, `/jury results`.

**Long description (paste into the listing):**
> **TheJury** brings quick, no-account polls into your server.
>
> • `/jury create` — a poll with a vote button per option; results update in the message as people vote.
> • `/jury schedule` — find a session night; proposes the next Fridays or your own dates (multi-select availability).
> • `/jury results <code>` — check the tally any time.
> • `/jury link` — connect the server to a free TheJury account so polls also show up on thejury.app, with a "View full results" link on every poll.
>
> No privileged intents, no account needed to vote. Free to use.

**Tags:** `Utility`, `Productivity`, `Polls`
**Prefix:** `/` (slash commands)
**Website:** https://thejury.app
**Support server / invite:** add your own.

**Server-count stats (optional):** set `TOPGG_TOKEN` (from your bot's top.gg
page → Webhooks/API) and the bot posts `server_count` every 30 minutes.
