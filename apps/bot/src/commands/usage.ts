/**
 * OpenAI API usage and costs command (admin only).
 * Ported from /opt/slimy/app/commands/usage.js
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import {
  parseWindow,
  fetchOpenAIUsage,
  fetchLocalImageStats,
  aggregateUsage,
  PRICING,
} from "../lib/usage-openai.js";
import { logError } from "../lib/logger.js";
import { metrics } from "../lib/metrics.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usage")
    .setDescription("View OpenAI API usage and costs (admin only)")
    .addStringOption((option) =>
      option.setName("window").setDescription("Time window for usage stats").addChoices(
        { name: "Today", value: "today" },
        { name: "Last 7 days", value: "7d" },
        { name: "Last 30 days", value: "30d" },
        { name: "This month", value: "this_month" },
        { name: "Custom range", value: "custom" },
      ).setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("start").setDescription("Start date (YYYY-MM-DD) for custom window").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("end").setDescription("End date (YYYY-MM-DD) for custom window").setRequired(false),
    ),

  async execute(interaction: {
    options: {
      getString: (name: string) => string | null;
    };
    member: {
      permissions: { has: (perm: bigint) => boolean };
    } | null;
    guildId: string | null;
    deferReply: (opts: { ephemeral: boolean }) => Promise<void>;
    editReply: (opts: { embeds?: EmbedBuilder[]; content?: string }) => Promise<void>;
    reply: (opts: { content: string; ephemeral?: boolean }) => Promise<void>;
  }): Promise<void> {
    try {
      const hasPermission =
        interaction.member?.permissions.has(PermissionFlagsBits.Administrator) ||
        interaction.member?.permissions.has(PermissionFlagsBits.ManageGuild);

      if (!hasPermission) {
        await interaction.reply({
          content: "❌ This command is restricted to administrators only.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const windowOption = interaction.options.getString("window") || "7d";
      const startOption = interaction.options.getString("start");
      const endOption = interaction.options.getString("end");

      let startDate: string;
      let endDate: string;
      try {
        ({ startDate, endDate } = parseWindow(
          windowOption,
          startOption,
          endOption,
        ));
      } catch (err) {
        await interaction.editReply({
          content: `❌ Invalid date range: ${(err as Error).message}`,
        });
        return;
      }

      logError("[usage] Fetching usage data", undefined, {
        window: windowOption,
        startDate,
        endDate,
      });

      const [apiData, localImageStats] = await Promise.allSettled([
        fetchOpenAIUsage(startDate, endDate),
        fetchLocalImageStats(interaction.guildId, startDate, endDate),
      ]);

      const apiResult = apiData.status === "fulfilled" ? apiData.value : null;
      const imageResult =
        localImageStats.status === "fulfilled" ? localImageStats.value : null;

      const { byModel, totalCost, totalRequests } = aggregateUsage(
        apiResult,
        imageResult,
      );

      const embed = new EmbedBuilder()
        .setTitle("OpenAI API Usage & Costs")
        .setColor(0x10a37f)
        .setDescription(
          `**Period:** ${startDate} to ${endDate}\n**Total Requests:** ${totalRequests.toLocaleString()}\n**Total Cost:** $${totalCost.toFixed(4)}`,
        )
        .setTimestamp();

      if (byModel.length > 0) {
        const sortedModels = [...byModel].sort((a, b) => b.cost - a.cost);
        const topModel = sortedModels[0];

        for (const model of sortedModels.slice(0, 10)) {
          const parts: string[] = [];

          if (model.inputTokens !== undefined) {
            parts.push(`**Tokens:** ${model.inputTokens.toLocaleString()} in`);
            parts.push(`${model.outputTokens?.toLocaleString() || 0} out`);
          }

          if (model.images !== undefined) {
            parts.push(
              `**Images:** ${model.images}`,
            );
          }

          parts.push(`**Requests:** ${model.requests.toLocaleString()}`);
          parts.push(`**Cost:** $${model.cost.toFixed(4)}`);

          embed.addFields({
            name: model.model,
            value: parts.join(" • "),
            inline: false,
          });
        }

        if (sortedModels.length > 10) {
          embed.setFooter({
            text: `Showing top 10 of ${sortedModels.length} models • Top spender: ${topModel.model}`,
          });
        } else if (topModel) {
          embed.setFooter({ text: `Top spender: ${topModel.model}` });
        }
      } else {
        embed.addFields({
          name: "No Usage Data",
          value:
            "No usage data found for this period. Either no API calls were made, or the OpenAI usage API is not accessible.",
        });
      }

      const pricingLines = [
        `**gpt-4o-mini:** $${PRICING["gpt-4o-mini"].input_per_million}/M input, $${PRICING["gpt-4o-mini"].output_per_million}/M output`,
        `**dall-e-3:** $${PRICING["dall-e-3"].standard} standard, $${PRICING["dall-e-3"].hd} HD (per image)`,
      ];
      embed.addFields({
        name: "Pricing Used",
        value: pricingLines.join("\n"),
        inline: false,
      });

      await interaction.editReply({ embeds: [embed] });
      metrics.trackCommand("usage", 0, true);
    } catch (err) {
      logError("[usage] Command failed", undefined, { error: (err as Error).message });
      const reply = {
        content: `❌ Failed to fetch usage data: ${(err as Error).message}`,
      };

      try {
        await interaction.editReply(reply);
      } catch {
        await interaction.reply({ ...reply, ephemeral: true });
      }
    }
  },
};
