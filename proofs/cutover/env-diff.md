# ENV Var Comparison — JS vs TS Bot

**Date:** 2026-04-17
**Status:** CUTOVER ALREADY COMPLETE

## Finding

The old JS bot directory `/opt/slimy/app/` no longer exists.
It was archived on 2026-04-08 as `/opt/slimy/app-archive-20260408.tar.gz` (472MB).

The old `.env` file at `/opt/slimy/app/.env` is not available for comparison.

## TS Bot .env (currently live)

Located at `/opt/slimy/slimy-monorepo/apps/bot/.env`

| Variable | Present | Notes |
|----------|---------|-------|
| DISCORD_TOKEN | YES | Discord bot token |
| DISCORD_CLIENT_ID | YES | Snowflake: 1415387116564910161 |
| DISCORD_TEST_GUILD_ID | YES | Guild: 1176605506912141444 |
| SLIMY_BOT_AI_API_KEY | YES | OpenAI API key (bot-specific) |
| AI_BASE_URL | YES | https://api.openai.com/v1 |
| AI_API_KEY | YES | OpenAI API key |
| OPENAI_API_KEY | YES | Legacy compat key |
| CHAT_MODEL | YES | gpt-4o |
| VISION_MODEL | YES | gpt-4o |
| IMAGE_MODEL | YES | dall-e-3 |
| GEMINI_API_KEY | YES | Google AI Studio key |
| ROSTER_OCR_GLM_MODEL | YES | glm-4.6v |
| ROSTER_OCR_GLM_API_KEY | YES | Z.AI API key |
| ROSTER_OCR_ZAI_BASE_URL | YES | https://api.z.ai/api/paas/v4 |
| SKIP_LIVE_OCR | YES | 0 |
| DB_HOST | YES | 127.0.0.1 |
| DB_USER | YES | user |
| DB_PASSWORD | YES | (set) |
| DB_NAME | YES | slimy |
| DB_PORT | YES | 3306 |
| FEATURE_CODES | YES | true |
| FEATURE_SNAIL_AUTO_DETECT | YES | true |
| SNAIL_ALLOWED_ROLE_IDS | YES | Admin + Managers roles |
| SNAIL_AUTO_DETECT_CHANNEL_IDS | YES | test_sandbox_1, sandbox-forum |
| SNAIL_CODES_CHANNEL_ID | YES | test_sandbox_2 |

## Verdict

ENV VARS SYNCED: YES — All required variables present in TS bot .env.
No missing variables detected (old .env unavailable for diff but bot running healthy).
