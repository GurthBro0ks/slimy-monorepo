/**
 * Airdrop farming commands.
 * Ported from /opt/slimy/app/commands/farming.js
 */

import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";

const TRADING_BOT_API = process.env.TRADING_BOT_API || "http://localhost:8510";

async function callFarmingAPI(
  endpoint: string,
  method = "GET",
  body: Record<string, unknown> | null = null,
): Promise<Record<string, unknown>> {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const resp = await fetch(`${TRADING_BOT_API}${endpoint}`, options);
    return await resp.json() as Record<string, unknown>;
  } catch (error) {
    return {
      status: "error",
      message: `API unreachable: ${(error as Error).message}`,
    };
  }
}

async function handleTrigger(interaction: ChatInputCommandInteraction): Promise<void> {
  const mode = interaction.options.getString("mode") || "dry";
  const dryRun = mode === "dry";

  const modeEmoji = dryRun ? "🧪" : "🚀";
  const modeText = dryRun ? "SIMULATION" : "LIVE";

  await interaction.deferReply();

  const result = await callFarmingAPI("/api/farming/trigger", "POST", {
    dry_run: dryRun,
  });

  if (result.status === "success") {
    const r = result.report as {
      total_actions?: number;
      weekly_spend_usd?: number;
      weekly_budget_usd?: number;
      farming_quality?: string;
      protocols_used_ever?: string[];
    };
    const embed = new EmbedBuilder()
      .setTitle(`${modeEmoji} Base Farming — ${modeText}`)
      .setColor(dryRun ? 0x3498db : 0x2ecc71)
      .addFields(
        { name: "Total Actions", value: `${r?.total_actions || 0}`, inline: true },
        {
          name: "Weekly Spend",
          value: `${(r?.weekly_spend_usd || 0).toFixed(2)} / ${(r?.weekly_budget_usd || 5).toFixed(2)}`,
          inline: true,
        },
        { name: "Quality", value: r?.farming_quality || "N/A", inline: true },
        {
          name: "Protocols Used",
          value: (r?.protocols_used_ever || []).join(", ") || "None yet",
          inline: false,
        },
      )
      .setFooter({
        text: dryRun ? "Dry run — no real gas spent" : "⚠️ LIVE — real transactions executed",
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({ content: `❌ Farming failed: ${result.message}` });
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const result = await callFarmingAPI("/api/farming/status");

  if (result.status === "success") {
    const f = result.farming as {
      farming_quality?: string;
      actions_last_30d?: number;
      weekly_spend_usd?: number;
      weekly_budget_usd?: number;
      unique_protocols_30d?: number;
      unique_pairs_30d?: number;
    };
    const airdrops = result.airdrops as Array<{
      protocol: string;
      token: string;
      status: string;
      est_value: string;
      tier: string;
    }>;

    let description = `**📊 Farming Quality:** ${f?.farming_quality || "N/A"}\n`;
    description += `**🔄 Actions (30d):** ${f?.actions_last_30d || 0}\n`;
    description += `**💰 Weekly Spend:** ${(f?.weekly_spend_usd || 0).toFixed(2)} / ${(f?.weekly_budget_usd || 5).toFixed(2)}\n`;
    description += `**🔗 Protocols (30d):** ${f?.unique_protocols_30d || 0}\n`;
    description += `**🪙 Pairs (30d):** ${f?.unique_pairs_30d || 0}\n\n`;

    if (airdrops && airdrops.length > 0) {
      description += "**🎯 Airdrop Targets:**\n";
      for (const a of airdrops) {
        const emoji = a.tier === "S" ? "🔥" : a.tier === "A" ? "✅" : a.tier === "F" ? "❌" : "❓";
        description += `${emoji} **${a.protocol}** (${a.token}) — ${a.status} — ${a.est_value}\n`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("🌾 Airdrop Farming Dashboard")
      .setDescription(description)
      .setColor(0x2ecc71)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({ content: `❌ Status check failed: ${result.message}` });
  }
}

async function handleLog(interaction: ChatInputCommandInteraction): Promise<void> {
  const count = interaction.options.getInteger("count") || 5;
  await interaction.deferReply();

  const result = await callFarmingAPI(`/api/farming/log?n=${count}`);

  if (
    result.status === "success" &&
    Array.isArray(result.entries) &&
    result.entries.length > 0
  ) {
    const entries = result.entries as Array<{
      timestamp: string;
      status: string;
      type: string;
      protocol: string;
      amount_usd?: number;
    }>;
    const total = (result.total as number) || entries.length;

    let logText = "";
    for (const entry of entries) {
      const time = new Date(entry.timestamp).toLocaleString();
      const status = entry.status === "simulated" ? "🧪" : "🚀";
      const amount = entry.amount_usd ? `${entry.amount_usd.toFixed(2)}` : "";
      logText += `${status} \`${time}\` — **${entry.type}** on ${entry.protocol} ${amount}\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 Last ${entries.length} Farming Actions (${total} total)`)
      .setDescription(logText)
      .setColor(0x3498db)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({ content: "No farming actions recorded yet." });
  }
}

async function handleAirdrops(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const result = await callFarmingAPI("/api/farming/airdrop-targets");

  if (result.status === "success") {
    const targets = result.targets as Record<string, {
      token: string;
      est_value: string;
      note?: string;
      tier: string;
    }>;

    let tierS = "", tierA = "", tierF = "";

    for (const [key, data] of Object.entries(targets)) {
      const line = `**${key}** (${data.token}) — ${data.est_value}\n  _${data.note || ""}_\n`;
      if (data.tier === "S") tierS += line;
      else if (data.tier === "A") tierA += line;
      else if (data.tier === "F") tierF += line;
    }

    const embed = new EmbedBuilder()
      .setTitle("🎯 Airdrop Targets — March 2026")
      .setColor(0xf1c40f)
      .addFields(
        { name: "🔥 Tier S — CONFIRMED (Farm NOW)", value: tierS || "None", inline: false },
        { name: "✅ Tier A — SEASON LIVE", value: tierA || "None", inline: false },
        { name: "❌ Tier F — COMPLETED (Stop)", value: tierF || "None", inline: false },
      )
      .setFooter({ text: "Status: /farm status | Trigger: /farm trigger" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({ content: `❌ Failed to fetch targets: ${result.message}` });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("farm")
    .setDescription("Airdrop farming commands")
    .addSubcommand((sub) =>
      sub
        .setName("trigger")
        .setDescription("Trigger a Base farming action")
        .addStringOption((opt) =>
          opt.setName("mode").setDescription("Run mode").addChoices(
            { name: "Simulation (dry run)", value: "dry" },
            { name: "Live (real gas)", value: "live" },
          ),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Show farming dashboard with quality score"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("log")
        .setDescription("Show recent farming actions")
        .addIntegerOption((opt) =>
          opt.setName("count").setDescription("Number of entries to show").setMinValue(1).setMaxValue(50),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("airdrops").setDescription("Show tiered airdrop targets"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "trigger") {
      return handleTrigger(interaction);
    } else if (subcommand === "status") {
      return handleStatus(interaction);
    } else if (subcommand === "log") {
      return handleLog(interaction);
    } else if (subcommand === "airdrops") {
      return handleAirdrops(interaction);
    }
  },
};
