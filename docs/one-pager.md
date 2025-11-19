# Slimy.ai – Executive Summary

## What is Slimy.ai?

**Slimy.ai** is an AI-powered platform that helps players of the mobile game *Super Snail* manage their progress, analyze their clubs, and stay up-to-date with the latest game codes and strategies. Think of it as a smart assistant that lives both on Discord (where gaming communities chat) and on the web (where players can access detailed dashboards and tools). When players take screenshots of their game progress, Slimy can analyze them using AI vision technology to extract statistics, suggest improvements, and track growth over time.

Beyond individual player tools, Slimy.ai serves as a hub for Discord communities. Server administrators can install the Slimy bot to provide their members with instant access to secret codes, AI chat assistance, and analytics. The web dashboard lets club leaders monitor their team's performance, compare stats across members, and export data to Google Sheets for deeper analysis. All of this is powered by modern AI technology, including GPT-4 Vision for understanding game screenshots and conversational AI for answering player questions.

At its core, Slimy.ai bridges the gap between casual mobile gaming and serious data-driven optimization. Whether you're a solo player looking for the latest codes or a competitive club tracking every member's contribution, Slimy provides the tools to play smarter, not harder.

---

## How Information Flows

```
┌──────────────────────────────────────────────────────────────┐
│                         USERS                                 │
│  (Super Snail players on Discord & Web browsers)             │
└────────────────┬──────────────────────┬──────────────────────┘
                 │                      │
                 ▼                      ▼
      ┌──────────────────┐   ┌──────────────────────┐
      │  Discord Bot     │   │  Web Dashboard       │
      │                  │   │  (slimy.ai)          │
      │  • Chat commands │   │  • Snail tools       │
      │  • Secret codes  │   │  • Club analytics    │
      │  • AI assistant  │   │  • Screenshot upload │
      └────────┬─────────┘   └──────────┬───────────┘
               │                        │
               └────────────┬───────────┘
                            ▼
                ┌────────────────────────┐
                │   Slimy Services       │
                │                        │
                │  • Admin API           │
                │  • Authentication      │
                │  • Image processing    │
                │  • AI vision analysis  │
                └──────────┬─────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐  ┌─────────────┐
   │ Database   │   │ File       │  │ External    │
   │            │   │ Storage    │  │ Services    │
   │ • Users    │   │            │  │             │
   │ • Guilds   │   │ • Screen-  │  │ • OpenAI    │
   │ • Stats    │   │   shots    │  │ • Reddit    │
   │ • Chat     │   │ • Variants │  │ • Snelp API │
   │   history  │   │            │  │ • Google    │
   │ • Codes    │   │            │  │   Sheets    │
   └────────────┘   └────────────┘  └─────────────┘
```

**In plain terms:** Players interact through Discord or the web. Their requests go to Slimy's backend services, which handle authentication (making sure you are who you say you are), process images, run AI analysis, and store everything in a database. External services like OpenAI provide the "brains" for understanding screenshots, while Reddit and other APIs supply fresh game codes.

---

## Why This Exists / What It's Good At

**The Problem:** Mobile games like *Super Snail* have deep progression systems with hundreds of stats, items, and strategies. Players manually track their progress in spreadsheets, scour Reddit for secret codes, and struggle to compare their club's performance. Game screenshots contain valuable data, but extracting it by hand is tedious and error-prone.

**The Solution:** Slimy.ai automates the boring parts and amplifies the fun parts:

- **AI Vision:** Upload a screenshot, get instant stats extraction and personalized recommendations
- **Real-time Code Aggregation:** Never miss a secret code again—Slimy pulls them from multiple sources automatically
- **Club Intelligence:** See your team's progress at a glance with AI-generated insights and trend analysis
- **Discord Integration:** Access tools where your community already lives, without switching apps
- **Data Portability:** Export everything to Google Sheets for custom analysis

**What Makes It Special:**
- **GPT-4 Vision Integration:** Truly understands game UI, not just OCR text recognition
- **Community-First Design:** Built for Discord servers, not just individual players
- **Privacy-Conscious:** Role-based access controls and audit logging keep data secure
- **Open Development:** Monorepo structure makes it easy for contributors to understand and extend

---

## Architecture in Plain English

### The Three Layers

**1. User Layer (What You See)**
- **Discord Bot:** Responds to slash commands like `/codes` or `/analyze`
- **Web Portal:** Modern website with dashboards, galleries, and interactive tools
- **Authentication:** Log in once with Discord, access everything seamlessly

**2. Service Layer (The Engine)**
- **Admin API:** Handles uploading screenshots, managing Discord server settings, and user permissions
- **Image Processing:** Automatically generates thumbnails and optimized versions of screenshots
- **AI Analysis:** Sends images to OpenAI GPT-4 Vision with carefully crafted prompts to extract game data
- **Code Aggregation:** Polls Reddit and the Snelp API every hour for new secret codes
- **Caching:** Stores frequently-accessed data (like codes) in Redis for instant responses

**3. Storage Layer (Where Data Lives)**
- **PostgreSQL Database:** Stores user profiles, Discord server configurations, chat history, club stats, and analysis results
- **File System:** Holds uploaded screenshots in multiple sizes (original, XL, thumbnail)
- **Redis Cache:** Temporary storage for data that changes frequently (60-second cache for codes)
- **Google Sheets:** Optional export destination for players who want to analyze data their own way

### How the Pieces Talk

When you upload a screenshot:
1. **Web/Discord → Admin API:** Your image is sent via secure HTTPS
2. **Admin API → Database:** Creates a record of who uploaded what, when
3. **Admin API → File Storage:** Saves the original and generates optimized versions
4. **Admin API → OpenAI:** Sends the image with a prompt like "Extract all stats from this Super Snail screenshot"
5. **OpenAI → Admin API:** Returns structured data (numbers, categories, recommendations)
6. **Admin API → Database:** Stores the extracted stats, tags, and insights
7. **Database → Web/Discord:** You see your stats in a nice dashboard or chat message

### Technology Choices

**Why Node.js/TypeScript:** Fast development, huge ecosystem, same language on frontend and backend
**Why Next.js:** Server-side rendering for SEO, great developer experience, easy deployment
**Why PostgreSQL:** Mature, reliable, handles complex queries for analytics
**Why Docker:** Consistent environments from development to production, easy scaling
**Why Monorepo:** Shared code between services, atomic changes across the platform

### Deployment

Everything runs in **Docker containers** on a single server:
- **Caddy** reverse proxy handles incoming traffic and automatic HTTPS certificates
- **Web app** serves the public-facing website (port 3000)
- **Admin API** handles backend logic (port 3080)
- **PostgreSQL** stores all persistent data
- **Redis** speeds up frequently-accessed content
- **Systemd** keeps services running 24/7 and restarts them if they crash

**Security:** Discord OAuth ensures only authorized users can access their data. Role-based permissions control who can manage guilds or view analytics. All communication uses encrypted HTTPS. Audit logs track every action for compliance.

---

## The Bottom Line

**Slimy.ai** turns a mobile game into a data-driven experience. It's like having a personal analyst, code hunter, and Discord moderator rolled into one AI-powered platform. Whether you're a casual player checking codes or a competitive club tracking every stat, Slimy handles the tedious work so you can focus on playing.

Built with modern web technologies and AI, it's designed to grow with the community—new tools, games, and features can be added to the monorepo without disrupting existing services. The result is a platform that's powerful for serious players but approachable for everyone.
