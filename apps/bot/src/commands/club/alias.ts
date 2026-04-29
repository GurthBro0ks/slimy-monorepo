import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { database } from '../../lib/database.js';
import { canonicalize, findLikelyMemberId, addAlias } from '../../lib/club-store.js';
import { trackCommand } from '../../lib/metrics.js';

function checkOwnerOrAdmin(interaction: ChatInputCommandInteraction): boolean {
  const ownerId = process.env.BOT_OWNER_ID;
  if (ownerId && interaction.user.id === ownerId) return true;
  const member = interaction.member as unknown;
  if (member && typeof member === 'object' && member !== null && 'permissions' in member) {
    const m = member as { permissions: { has: (flag: bigint) => boolean } };
    if (m.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  }
  const roleId = process.env.CLUB_ROLE_ID;
  if (roleId && member && typeof member === 'object' && member !== null && 'roles' in member) {
    const m = member as { roles: { cache: { has: (id: string) => boolean } } };
    if (m.roles?.cache?.has(roleId)) return true;
  }
  return false;
}

async function handleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
  const aliasInput = interaction.options.getString('alias', true).trim();
  const canonicalInput = interaction.options.getString('canonical', true).trim();
  const guildId = interaction.guildId!;

  const aliasCanonical = canonicalize(aliasInput);
  const memberCanonical = canonicalize(canonicalInput);

  if (!aliasCanonical) {
    await interaction.reply({ content: '❌ Alias name is empty after normalization.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!memberCanonical) {
    await interaction.reply({ content: '❌ Canonical name is empty after normalization.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (aliasCanonical === memberCanonical) {
    await interaction.reply({ content: '❌ Alias and canonical name resolve to the same value.', flags: MessageFlags.Ephemeral });
    return;
  }

  const memberId = await findLikelyMemberId(guildId, memberCanonical);
  if (!memberId) {
    await interaction.reply({
      content: `❌ No existing member found matching "${canonicalInput}". Add them to the club first (via /club-push), then create the alias.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  interface ExistingAlias { alias_canonical: string; }
  const [existing] = await database.query<ExistingAlias[]>(
    'SELECT alias_canonical FROM club_aliases WHERE guild_id = ? AND alias_canonical = ?',
    [guildId, aliasCanonical],
  );
  if (existing) {
    await interaction.reply({
      content: `❌ Alias "${aliasInput}" already exists. Remove it first with /club-alias remove.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await addAlias(guildId, memberId, aliasCanonical);

  await interaction.reply({
    content: `✅ Alias created: **${aliasInput}** → **${canonicalInput}**\n\`${aliasCanonical}\` → member_id ${memberId}`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;

  interface AliasRow {
    alias_canonical: string;
    name_display: string;
    name_canonical: string;
  }
  const aliases = await database.query<AliasRow[]>(
    `SELECT ca.alias_canonical, cm.name_display, cm.name_canonical
     FROM club_aliases ca
     JOIN club_members cm ON cm.id = ca.member_id
     WHERE ca.guild_id = ?
     ORDER BY cm.name_display, ca.alias_canonical`,
    [guildId],
  );

  if (!aliases.length) {
    await interaction.reply({ content: 'No aliases configured for this guild.', flags: MessageFlags.Ephemeral });
    return;
  }

  const formatAlias = (alias: string) =>
    alias.split(' ').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

  const grouped = new Map<string, { display: string; aliases: string[] }>();
  for (const row of aliases) {
    if (!grouped.has(row.name_canonical)) {
      grouped.set(row.name_canonical, { display: row.name_display, aliases: [] });
    }
    grouped.get(row.name_canonical)!.aliases.push(row.alias_canonical);
  }

  const lines = Array.from(grouped.entries()).map(([, data]) => {
    const aliasList = data.aliases.map((a) => formatAlias(a)).join(', ');
    return `**${data.display}** ← ${aliasList}`;
  });

  const description = lines.slice(0, 20).join('\n');
  const footer = lines.length > 20 ? `Showing 20 of ${lines.length} members with aliases` : undefined;

  await interaction.reply({
    content: `**Club Aliases (${aliases.length})**\n${description}${footer ? `\n_${footer}_` : ''}`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
  const aliasInput = interaction.options.getString('alias', true).trim();
  const guildId = interaction.guildId!;
  const aliasCanonical = canonicalize(aliasInput);

  if (!aliasCanonical) {
    await interaction.reply({ content: '❌ Alias name is empty after normalization.', flags: MessageFlags.Ephemeral });
    return;
  }

  const result = await database.execute(
    'DELETE FROM club_aliases WHERE guild_id = ? AND alias_canonical = ?',
    [guildId, aliasCanonical],
  );

  if (result.affectedRows === 0) {
    await interaction.reply({
      content: `❌ No alias found matching "${aliasInput}".`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    content: `✅ Removed alias: **${aliasInput}** (\`${aliasCanonical}\`)`,
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('club-alias')
    .setDescription('Manage club member name aliases for OCR name matching')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add an alias for an existing club member (admin only)')
        .addStringOption((opt) =>
          opt.setName('alias').setDescription('The alternate name (e.g. OCR variant)').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('canonical').setDescription('The real member name in the database').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('List all aliases for this guild'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove an alias (admin only)')
        .addStringOption((opt) =>
          opt.setName('alias').setDescription('The alias to remove').setRequired(true),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: '❌ This command can only be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const startTime = Date.now();

    try {
      if (subcommand === 'add') {
        if (!checkOwnerOrAdmin(interaction)) {
          await interaction.reply({ content: '❌ Only administrators can add aliases.', flags: MessageFlags.Ephemeral });
          return;
        }
        await handleAdd(interaction);
      } else if (subcommand === 'list') {
        await handleList(interaction);
      } else if (subcommand === 'remove') {
        if (!checkOwnerOrAdmin(interaction)) {
          await interaction.reply({ content: '❌ Only administrators can remove aliases.', flags: MessageFlags.Ephemeral });
          return;
        }
        await handleRemove(interaction);
      }

      trackCommand(`club-alias-${subcommand}`, Date.now() - startTime, true);
    } catch (err) {
      console.error('[club-alias] Error:', err);
      trackCommand(`club-alias-${subcommand}`, Date.now() - startTime, false);
      const msg = `❌ ${(err as Error).message}`;
      if (interaction.deferred) {
        await interaction.editReply(msg);
      } else {
        await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
      }
    }
  },
};
