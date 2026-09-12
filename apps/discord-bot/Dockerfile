# TheJury Discord bot.
# Build context is this folder (apps/discord-bot) — set that as the
# "Base Directory" in Coolify.
FROM node:22-alpine

WORKDIR /app

# Install deps (incl. tsx, which runs the TypeScript directly).
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Register slash commands (idempotent), then run the gateway bot.
# Register is attempted but never blocks the bot from starting.
CMD ["sh", "-c", "npm run register; npm start"]
