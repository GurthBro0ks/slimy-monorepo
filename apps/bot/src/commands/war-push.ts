/**
 * /war-push — Export Sim Wars troop war sheet for the guild.
 *
 * Loads all scanned troop records from sim_wars_troop_latest, sorts by chosen
 * stat, returns a preview embed + full CSV attachment with exact raw values.
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { listTroopsSorted, buildTroopCsv, type TroopSortField } from '../lib/sim-wars-troop-store.js';
import { createLogger } from '../lib/logger.js';

const logger = createLogger({ context: 'war-push' });

const SORT_CHOICES: Array<{ name: string; value: TroopSortField }> = [
  { name: 'Power', value: 'power' },
  { name: 'HP', value: 'hp' },
  { name: 'Attack', value: 'attack' },
  { name: 'Defense', value: 'defense' },
  { name: 'Rush', value: 'rush' },
  { name: 'Leadership', value: 'leadership' },
  { name: 'CRIT DMG REDUC', value: 'crit' },
  { name: 'Fire', value: 'fire' },
  { name: 'Water', value: 'water' },
  { name: 'Earth', value: 'earth' },
  { name: 'Wind', value: 'wind' },
  { name: 'Poison', value: 'poison' },
  { name: 'Last Updated', value: 'updated' },
];

const PREVIEW_LIMIT = 10;

function compactNumber(value: unknown): string {
  if (value === null || value === undefined) return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  if (Number.isInteger(num)) return num.toLocaleString();
  return num.toFixed(1);
}

function compactPercent(value: unknown): string {
  if (value === null || value === undefined) return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return Number.isInteger(num) ? `${num}%` : `${num.toFixed(1)}%`;
}

function compactLeadership(cur: unknown, max: unknown): string {
  const c = cur !== null && cur !== undefined ? Number(cur) : null;
  const m = max !== null && max !== undefined ? Number(max) : null;
  const cOk = c !== null && Number.isFinite(c);
  const mOk = m !== null && Number.isFinite(m);
  if (cOk && mOk) return `${Math.floor(c).toLocaleString()}/${Math.floor(m).toLocaleString()}`;
  if (cOk) return `${Math.floor(c).toLocaleString()}/—`;
  if (mOk) return `—/${Math.floor(m).toLocaleString()}`;
  return '—';
}

function sortLabel(field: TroopSortField): string {
  const choice = SORT_CHOICES.find(c => c.value === field);
  return choice ? choice.name : field;
}

function sortColumnKey(field: TroopSortField): string | null {
  const map: Record<string, string> = {
    power: 'troop_power',
    hp: 'troop_hp',
    attack: 'troop_attack',
    defense: 'troop_defense',
    rush: 'troop_rush',
    leadership: 'troop_leadership_current',
    crit: 'troop_crit_dmg_reduc_pct',
    fire: 'troop_fire_dmg',
    water: 'troop_water_dmg',
    earth: 'troop_earth_dmg',
    wind: 'troop_wind_dmg',
    poison: 'troop_poison_dmg',
  };
  return map[field] ?? null;
}

function formatSortField(row: Record<string, unknown>, field: TroopSortField): string {
  if (field === 'leadership') {
    return compactLeadership(row.troop_leadership_current, row.troop_leadership_max);
  }
  const col = sortColumnKey(field);
  if (!col) return '';
  const val = row[col];
  if (field === 'crit') return compactPercent(val);
  return compactNumber(val);
}

function buildPreviewTable(
  rows: Array<Record<string, unknown>>,
  sortField: TroopSortField,
): string {
  const lines: string[] = [];
  const showSortCol = !['power', 'hp', 'attack', 'defense', 'rush', 'leadership'].includes(sortField);

  lines.push('#  Name              Power      HP       ATK       DEF      Rush    Lead');

  if (showSortCol) {
    const label = sortLabel(sortField).padEnd(8);
    lines[0] += `  ${label}`;
  }

  const preview = rows.slice(0, PREVIEW_LIMIT);

  for (let i = 0; i < preview.length; i++) {
    const row = preview[i];
    const name = String(row.player_name ?? '???').slice(0, 18).padEnd(18);
    const power = compactNumber(row.troop_power).padStart(8);
    const hp = compactNumber(row.troop_hp).padStart(8);
    const atk = compactNumber(row.troop_attack).padStart(8);
    const def = compactNumber(row.troop_defense).padStart(8);
    const rush = compactNumber(row.troop_rush).padStart(8);
    const lead = compactLeadership(row.troop_leadership_current, row.troop_leadership_max).padStart(8);

    let line = `${String(i + 1).padStart(2)} ${name}${power}${hp}${atk}${def}${rush}${lead}`;

    if (showSortCol) {
      const sortVal = formatSortField(row, sortField).padStart(8);
      line += sortVal;
    }

    lines.push(line);
  }

  return lines.join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('war-push')
    .setDescription('Export Sim Wars troop war sheet for this server')
    .addStringOption(opt =>
      opt
        .setName('sort')
        .setDescription('Sort field (default: power)')
        .addChoices(...SORT_CHOICES)
        .setRequired(false),
    )
    .addIntegerOption(opt =>
      opt
        .setName('limit')
        .setDescription('Max players to include (default: all)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false),
    )
    .addBooleanOption(opt =>
      opt
        .setName('public')
        .setDescription('Post publicly instead of ephemeral (default: false)')
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const sortField = (interaction.options.getString('sort') ?? 'power') as TroopSortField;
    const limit = interaction.options.getInteger('limit') ?? undefined;
    const isPublic = interaction.options.getBoolean('public') ?? false;

    const deferFlags = isPublic ? undefined : MessageFlags.Ephemeral;
    await interaction.deferReply({ flags: deferFlags });

    try {
      const rows = await listTroopsSorted(interaction.guildId, sortField, limit);

      if (rows.length === 0) {
        await interaction.editReply({ content: 'No Sim Wars troop data found for this server. Use **Analyze Individual Troop** to scan player screenshots first.' });
        return;
      }

      const previewTable = buildPreviewTable(rows, sortField);
      const latestAt = rows[0]?.latest_at ? new Date(String(rows[0].latest_at)).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : null;

      const embed = new EmbedBuilder()
        .setTitle('Sim Wars Troop Sheet')
        .setColor(0x00ff88)
        .setDescription(
          `**${rows.length}** scanned player${rows.length !== 1 ? 's' : ''} | Sorted by **${sortLabel(sortField)}** | CSV attached`,
        )
        .addFields({
          name: 'Top Players',
          value: '```\n' + previewTable + '\n```',
          inline: false,
        });

      const footerParts = [`Sorted by ${sortLabel(sortField)}`];
      if (limit) footerParts.push(`Limit: ${limit}`);
      if (latestAt) footerParts.push(`Latest: ${latestAt}`);
      embed.setFooter({ text: footerParts.join(' | ') });
      embed.setTimestamp();

      const csv = buildTroopCsv(rows);
      const buffer = Buffer.from(csv, 'utf-8');

      await interaction.editReply({
        embeds: [embed],
        files: [{ name: `sim-wars-war-sheet-${interaction.guildId}.csv`, attachment: buffer }],
      });

      logger.info('War push exported', {
        guildId: interaction.guildId,
        playerCount: rows.length,
        sortField,
        limit: limit ?? 'all',
        isPublic,
      });
    } catch (err) {
      logger.error('War push failed', err as Error, { guildId: interaction.guildId, sortField });
      await interaction.editReply({ content: `Failed to export war sheet: ${(err as Error).message}` });
    }
  },
};
