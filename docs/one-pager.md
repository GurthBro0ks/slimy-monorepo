# Slimy.ai – Executive Overview

## What Is Slimy.ai?

**Slimy.ai** (tagline: "Panel of Power") is a community platform for players of *Super Snail*, a popular mobile adventure game. Think of it as a Swiss Army knife for snail enthusiasts: it helps players discover secret promotional codes, track their game progress, analyze club performance through AI-powered screenshot reading, and chat with a personality-driven AI assistant. The platform combines a public-facing web dashboard, behind-the-scenes admin tools, and plans for a Discord bot that brings these features directly into the game's community servers.

The name "Slimy" comes from the snail theme of Super Snail—players nurture and evolve their snail companions through various adventures. What started as scattered tools (a web app here, a code scraper there) has evolved into a unified system where thousands of players can level up faster, discover hidden rewards, and manage their guilds with data-driven insights. It's a passion project "fueled by ADHD, driven by feet, motivated by ducks" (yes, really—it's in the codebase).

The heart of the platform is **aggregation and automation**: instead of players hunting across Reddit threads, Discord servers, and gaming wikis for the latest codes, Slimy.ai does the heavy lifting. It scrapes multiple sources every few minutes, deduplicates codes, scores their reliability, and presents them in one clean interface with a "Copy All" button. For guild leaders, it goes further—upload screenshots of club stats, and OpenAI's vision AI extracts metrics automatically, saving hours of manual spreadsheet work.

---

## How It All Fits Together

Here's the architecture in picture form:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PLAYERS                                  │
│  (Super Snail gamers on web browsers & Discord)                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
         ┌───────────────────┐
         │   DISCORD BOT     │  ← Coming soon: commands, notifications
         │   (planned)       │     posts codes to channels
         └───────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────────────┐
│              SLIMY WEB DASHBOARD (Next.js)                     │
│  • Secret Codes feed (from 4+ sources)                         │
│  • Snail Timeline (event history)                              │
│  • Club Analytics (upload screenshots → AI reads stats)        │
│  • Slime Chat (AI conversations with personality modes)        │
│  • Login with Discord (OAuth)                                  │
└────────────┬───────────────────────────────────────────────────┘
             │
             ↓
    ┌────────────────────┐
    │   ADMIN API        │  ← Express.js backend
    │  (Node.js server)  │     • Authenticates users via Discord
    │                    │     • Manages guild permissions
    │                    │     • Processes screenshot uploads
    │                    │     • Proxies to external APIs
    └────────┬───────────┘
             │
             ├──────────────┐
             ↓              ↓
      ┌──────────┐    ┌─────────────────────┐
      │ DATABASE │    │  EXTERNAL SERVICES  │
      │ (Postgres)│   │  • Discord API      │
      │           │    │  • OpenAI (GPT-4V) │
      │ Stores:   │    │  • Reddit           │
      │ • Users   │    │  • Firecrawl        │
      │ • Codes   │    │  • PocketGamer      │
      │ • Chats   │    │  • SuperSnail.wiki  │
      │ • Clubs   │    └─────────────────────┘
      └───────────┘
```

**The flow**: A player visits the Slimy.ai website → logs in with their Discord account → sees personalized dashboards (admin tools if they're a moderator, regular snail tools otherwise). Behind the scenes, the Admin API talks to Discord to verify who you are, fetches secret codes from Reddit/wikis/scrapers every 10–15 minutes, and uses OpenAI's vision AI to "read" uploaded club screenshots. All data lives in a PostgreSQL database. Eventually, a Discord bot will bring features like code notifications directly into game community servers.

---

## Why This Exists / What It's Good At

**The Problem**: Super Snail players face three headaches:

1. **Code hunting is exhausting**: Promotional codes (redeemable for in-game currency) appear sporadically across Reddit, Discord, gaming blogs, and wikis. Players waste time checking 5+ sources manually.
2. **Club management is tedious**: Guild leaders screenshot member stats, then manually transcribe numbers into spreadsheets. It's error-prone and time-consuming.
3. **Information is scattered**: No central hub for tips, guides, progress tracking, or community tools.

**The Solution**: Slimy.ai automates the busy work.

- **Code Aggregator**: Fetches codes from 4+ sources (Reddit, Snelp, PocketGamer, wikis), deduplicates them, and shows everything in one feed. Trust scoring prevents fake codes from cluttering the list.
- **AI Screenshot Analysis**: Upload a club stats screenshot → GPT-4 Vision extracts numbers → auto-populates Google Sheets. What took 30 minutes now takes 30 seconds.
- **Unified Dashboard**: One login (via Discord) gives you codes, analytics, AI chat, and event timelines—no more tab juggling.

**What it's good at**:
- Saving players hours per week (especially guild officers)
- Providing *always-up-to-date* data (caches refresh every 10–60 minutes)
- Being nerdy-friendly but accessible (clean UI, no jargon)
- Respecting user privacy (no game account passwords needed—just Discord OAuth)

---

## Architecture in Plain English

Imagine Slimy.ai as a three-layer cake:

### Layer 1: The Front Door (Web Dashboard)
This is what players see—a Next.js web app (modern JavaScript framework) with pages like `/snail/codes` (code feed), `/club` (analytics), and `/chat` (AI assistant). It's styled with a fun snail theme, has dark mode, and works on phones. When you click "Login," it hands you off to Discord's official login page, then brings you back with access to your stuff.

### Layer 2: The Brain (Admin API)
This Express.js server (think of it as a traffic cop) sits between the web dashboard and the rest of the internet. It:
- **Authenticates** you by asking Discord "Is this person who they say they are?"
- **Aggregates** codes by asking Reddit, Firecrawl (a web scraper), and wikis for the latest promo codes, then combines and cleans the results
- **Processes** uploaded screenshots using OpenAI's GPT-4 Vision (an AI that can "read" images)
- **Protects** sensitive operations (like admin tools) by checking your Discord role before allowing access

### Layer 3: The Memory (Database + External Services)
- **PostgreSQL database**: Stores user preferences, chat histories, club analyses, and audit logs. It's the filing cabinet.
- **External APIs**: Discord (for user info), OpenAI (for AI smarts), Reddit (for community posts), Firecrawl (for web scraping), Google Sheets (for club data exports).

### Deployment (How It Runs)
Everything lives in **Docker containers** (isolated mini-computers) on two NUC machines (small servers). A reverse proxy called **Caddy** handles web traffic, encrypts connections (HTTPS), and routes requests to the right service. If one server goes down, the other takes over—like having a backup generator.

### The Tech Stack (for the curious)
- **Frontend**: Next.js 16 (React framework), TypeScript (safer JavaScript), Tailwind CSS (styling)
- **Backend**: Node.js 22, Express.js, Prisma (database toolkit)
- **AI**: OpenAI GPT-4 Vision for screenshot analysis, ChatGPT for conversational AI
- **Infrastructure**: Docker, Caddy (reverse proxy), PostgreSQL 16, systemd (Linux service manager)
- **Auth**: Discord OAuth2 (players log in with their Discord accounts—no passwords to remember)

---

## Current Status

- ✅ **Web Dashboard**: Live, with codes aggregator, AI chat, timeline viewer
- ✅ **Admin API**: Functional, handling auth, uploads, guild management
- ✅ **Code Aggregation**: Scraping 4 sources (Snelp, Reddit, PocketGamer, wiki) every 10–15 minutes
- ✅ **Screenshot AI**: OpenAI integration working, processes club stats images
- ⏳ **Discord Bot**: Scaffolding in place, not yet deployed
- ⏳ **Tier Calculator & Stats Tracking**: UI placeholders built, data pipelines in progress

**In short**: Slimy.ai is a production-ready tool that's already helping Super Snail players save time and level up smarter, with more features on the way.

---

*Questions? Check the main [README](../README.md) or explore [project structure docs](./STRUCTURE.md) for technical deep-dives.*
