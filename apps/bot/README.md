# Slimy Discord Bot

Discord bot for club management and tier tracking.

## Features

- **`/tier`** - Show tier breakdown for club members based on their total power

## Setup

### 1. Install Dependencies

```bash
cd apps/bot
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

- `DISCORD_TOKEN` - Your Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)
- `DISCORD_CLIENT_ID` - Your Discord application's client ID
- `DB_HOST` - MySQL database host
- `DB_PORT` - MySQL database port (default: 3306)
- `DB_USER` - MySQL database user
- `DB_PASSWORD` - MySQL database password
- `DB_NAME` - MySQL database name

### 3. Deploy Commands

Register the slash commands with Discord:

```bash
npm run deploy-commands
```

**Note:** Global commands can take up to 1 hour to update. For faster testing during development, you can modify `src/deploy-commands.js` to use guild-specific commands.

### 4. Start the Bot

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## Commands

### `/tier`

Shows a tier breakdown for club members based on their total power from the `club_latest` database table.

**Tier Thresholds:**
- **Tier I**: ≥ 10 billion total power
- **Tier II**: ≥ 1 billion total power
- **Tier III**: < 1 billion total power

**Output:**
- Total member count
- Number of members in each tier
- Top 5 members per tier (for Tiers I and II)
- Formatted power values (e.g., "10.5B", "1.2M")

**Example Usage:**
```
/tier
```

**Example Output:**
```
📊 Tier Breakdown for My Guild

Total Members: 45

🏆 Tier I (10.00B+): 3 members
  • Player1: 15.2B
  • Player2: 12.8B
  • Player3: 10.5B

🥈 Tier II (1.00B+): 12 members
  • Player4: 8.5B
  • Player5: 6.2B
  • Player6: 4.1B
  • Player7: 2.9B
  • Player8: 1.3B
  ...and 7 more

🥉 Tier III (<1.00B): 30 members
```

## Project Structure

```
apps/bot/
├── src/
│   ├── index.js              # Main bot entry point
│   ├── deploy-commands.js    # Command registration script
│   ├── commands/             # Slash command definitions
│   │   └── tier.js           # /tier command
│   └── lib/
│       └── database.js       # Database connection helper
├── .env.example              # Environment variable template
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Database Schema

The bot expects a MySQL database with a `club_latest` table:

```sql
CREATE TABLE club_latest (
  guild_id VARCHAR(255) NOT NULL,
  member_key VARCHAR(255) NOT NULL,
  total_power BIGINT NOT NULL,
  -- other columns...
  PRIMARY KEY (guild_id, member_key)
);
```

## Adding New Commands

1. Create a new file in `src/commands/` (e.g., `mycommand.js`)
2. Export an object with `data` (SlashCommandBuilder) and `execute` (async function)
3. Run `npm run deploy-commands` to register the new command
4. Restart the bot

**Example:**

```javascript
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mycommand")
    .setDescription("Description of my command"),

  async execute(interaction) {
    await interaction.reply("Hello from my command!");
  },
};
```

## Troubleshooting

### Commands not appearing in Discord

1. Make sure you ran `npm run deploy-commands`
2. Global commands can take up to 1 hour to update
3. Try using guild-specific commands for faster testing (modify `deploy-commands.js`)

### Database connection errors

1. Verify your `.env` file has correct database credentials
2. Ensure the MySQL database is running and accessible
3. Check that the `club_latest` table exists

### Bot not responding

1. Check that the bot is online in Discord
2. Verify the bot has appropriate permissions in your server
3. Check console logs for error messages

## License

Private - Part of Slimy monorepo
