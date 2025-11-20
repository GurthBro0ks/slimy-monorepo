"use strict";

const { SlashCommandBuilder } = require("discord.js");
const database = require("../lib/database");

// Tier thresholds
const TIER_THRESHOLDS = {
  I: 10_000_000_000,   // 10 billion
  II: 1_000_000_000,   // 1 billion
  III: 0,              // everything else
};

function formatPower(power) {
  if (power >= 1_000_000_000) {
    return `${(power / 1_000_000_000).toFixed(2)}B`;
  } else if (power >= 1_000_000) {
    return `${(power / 1_000_000).toFixed(2)}M`;
  } else if (power >= 1_000) {
    return `${(power / 1_000).toFixed(2)}K`;
  }
  return power.toString();
}

function assignTier(totalPower) {
  if (totalPower >= TIER_THRESHOLDS.I) {
    return "Tier I";
  } else if (totalPower >= TIER_THRESHOLDS.II) {
    return "Tier II";
  } else {
    return "Tier III";
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tier")
    .setDescription("Show tier breakdown for club members"),

  async execute(interaction) {
    try {
      // Defer reply since database query might take time
      await interaction.deferReply();

      const guildId = interaction.guildId;

      if (!guildId) {
        return await interaction.editReply({
          content: "❌ This command can only be used in a server!",
        });
      }

      // Check if database is configured
      if (!database.isConfigured()) {
        return await interaction.editReply({
          content: "❌ Database is not configured. Please contact an administrator.",
        });
      }

      // Query club_latest table for all members in this guild
      const members = await database.query(
        `SELECT member_key, total_power
         FROM club_latest
         WHERE guild_id = ?
         ORDER BY total_power DESC`,
        [guildId]
      );

      if (!members || members.length === 0) {
        return await interaction.editReply({
          content: "ℹ️ No club data found for this server.",
        });
      }

      // Categorize members into tiers
      const tiers = {
        "Tier I": [],
        "Tier II": [],
        "Tier III": [],
      };

      for (const member of members) {
        const totalPower = Number(member.total_power || 0);
        const tier = assignTier(totalPower);
        tiers[tier].push({
          key: member.member_key,
          power: totalPower,
        });
      }

      // Build response string
      let response = `**📊 Tier Breakdown for ${interaction.guild.name}**\n\n`;
      response += `Total Members: ${members.length}\n\n`;

      // Tier I
      response += `**🏆 Tier I** (${formatPower(TIER_THRESHOLDS.I)}+): ${tiers["Tier I"].length} members\n`;
      if (tiers["Tier I"].length > 0) {
        const topTier1 = tiers["Tier I"].slice(0, 5);
        for (const member of topTier1) {
          response += `  • ${member.key}: ${formatPower(member.power)}\n`;
        }
        if (tiers["Tier I"].length > 5) {
          response += `  _...and ${tiers["Tier I"].length - 5} more_\n`;
        }
      }
      response += "\n";

      // Tier II
      response += `**🥈 Tier II** (${formatPower(TIER_THRESHOLDS.II)}+): ${tiers["Tier II"].length} members\n`;
      if (tiers["Tier II"].length > 0) {
        const topTier2 = tiers["Tier II"].slice(0, 5);
        for (const member of topTier2) {
          response += `  • ${member.key}: ${formatPower(member.power)}\n`;
        }
        if (tiers["Tier II"].length > 5) {
          response += `  _...and ${tiers["Tier II"].length - 5} more_\n`;
        }
      }
      response += "\n";

      // Tier III
      response += `**🥉 Tier III** (<${formatPower(TIER_THRESHOLDS.II)}): ${tiers["Tier III"].length} members\n`;

      // Discord has a 2000 character limit for messages
      if (response.length > 2000) {
        response = response.substring(0, 1997) + "...";
      }

      await interaction.editReply({
        content: response,
      });

    } catch (error) {
      console.error("Error executing tier command:", error);

      const errorMessage = "❌ An error occurred while fetching tier data. Please try again later.";

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  },
};
