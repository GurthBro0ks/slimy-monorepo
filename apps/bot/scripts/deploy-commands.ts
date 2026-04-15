import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';

config({ path: join(__dirname, '..', '..', '.env') });

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_TEST_GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

function loadCommandData() {
  const commandsDir = join(__dirname, '..', 'commands');
  const files = readdirSync(commandsDir).filter(f => f.endsWith('.js') && !f.endsWith('.d.ts'));
  const commandData = [];
  for (const file of files) {
    try {
      const mod = require(join(commandsDir, file));
      const data = mod.data || mod.default?.data;
      if (data && typeof data.toJSON === 'function') {
        commandData.push(data.toJSON());
        console.log(`  loaded: ${(data as any).name} (type: ${(data as any).type ?? 'CHAT_INPUT'})`);
      }
    } catch (err) {
      console.warn(`  [SKIP] ${file}: ${(err as Error).message}`);
    }
  }
  return commandData;
}

async function main() {
  const commands = loadCommandData();
  console.log(`\nDeploying ${commands.length} commands...`);

  const rest = new REST({ version: '10' }).setToken(TOKEN!);

  if (GUILD_ID) {
    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID!, GUILD_ID),
      { body: commands }
    );
    console.log(`\u2713 Registered ${(data as any[]).length} guild commands to ${GUILD_ID} (instant)`);
  } else {
    const data = await rest.put(
      Routes.applicationCommands(CLIENT_ID!),
      { body: commands }
    );
    console.log(`\u2713 Registered ${(data as any[]).length} global commands (may take up to 1 hour to propagate)`);
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
