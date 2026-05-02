import {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
} from "discord.js";

export const ADMIN_ROLE_ID = "1178129227321712701";

function memberHasRole(member: ChatInputCommandInteraction["member"], roleId: string): boolean {
  if (!member) return false;

  if (member instanceof GuildMember) {
    return member.roles.cache.has(roleId);
  }

  const roles = member.roles;
  if (Array.isArray(roles)) {
    return roles.includes(roleId);
  }

  return false;
}

export async function requireAdminRole(
  interaction: ChatInputCommandInteraction,
  commandLabel: string,
): Promise<boolean> {
  if (memberHasRole(interaction.member, ADMIN_ROLE_ID)) {
    return true;
  }

  const content = `❌ ${commandLabel} is restricted to the Admin role.`;
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content });
  } else {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  }
  return false;
}
