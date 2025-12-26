"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { SettingsEditor, type BasicFieldConfig } from "@/components/settings/SettingsEditor";

export default function WebGuildSettingsPage() {
  const params = useParams();
  const guildId = useMemo(() => String((params as any)?.guildId || "").trim(), [params]);

  const basicFieldsConfig: BasicFieldConfig[] = [
    {
      id: "widget_enabled",
      label: "Widget enabled",
      kind: "select",
      options: [
        { value: "unset", label: "(unset)" },
        { value: "true", label: "enabled" },
        { value: "false", label: "disabled" },
      ],
      getValue: (settings) => {
        const v = settings?.prefs?.widget?.enabled;
        return typeof v === "boolean" ? (v ? "true" : "false") : "unset";
      },
      apply: (draft, next) => {
        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        const widget = typeof draft.prefs.widget === "object" && draft.prefs.widget ? { ...draft.prefs.widget } : {};
        if (next === "unset") delete widget.enabled;
        else widget.enabled = next === "true";
        if (Object.keys(widget).length) draft.prefs.widget = widget;
        else delete draft.prefs.widget;
      },
    },
    {
      id: "bot_enabled",
      label: "Bot enabled",
      kind: "select",
      options: [
        { value: "unset", label: "(unset)" },
        { value: "true", label: "enabled" },
        { value: "false", label: "disabled" },
      ],
      getValue: (settings) => {
        const v = settings?.prefs?.botEnabled;
        return typeof v === "boolean" ? (v ? "true" : "false") : "unset";
      },
      apply: (draft, next) => {
        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        if (next === "unset") delete draft.prefs.botEnabled;
        else draft.prefs.botEnabled = next === "true";
      },
    },
    {
      id: "admin_log_channel_id",
      label: "Admin log channel ID",
      kind: "text",
      getValue: (settings) =>
        typeof settings?.prefs?.channels?.adminLogChannelId === "string" ? settings.prefs.channels.adminLogChannelId : "",
      apply: (draft, next) => {
        const trimmed = String(next || "").trim();
        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        const channels = typeof draft.prefs.channels === "object" && draft.prefs.channels ? { ...draft.prefs.channels } : {};
        if (!trimmed) delete channels.adminLogChannelId;
        else channels.adminLogChannelId = trimmed;
        if (Object.keys(channels).length) draft.prefs.channels = channels;
        else delete draft.prefs.channels;
      },
    },
    {
      id: "global_chat_channel_id",
      label: "Global chat channel ID",
      kind: "text",
      getValue: (settings) =>
        typeof settings?.prefs?.channels?.globalChatChannelId === "string" ? settings.prefs.channels.globalChatChannelId : "",
      apply: (draft, next) => {
        const trimmed = String(next || "").trim();
        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        const channels = typeof draft.prefs.channels === "object" && draft.prefs.channels ? { ...draft.prefs.channels } : {};
        if (!trimmed) delete channels.globalChatChannelId;
        else channels.globalChatChannelId = trimmed;
        if (Object.keys(channels).length) draft.prefs.channels = channels;
        else delete draft.prefs.channels;
      },
    },
  ];

  return (
    <SettingsEditor
      scopeType="guild"
      scopeId={guildId}
      title="Guild Settings"
      description={`Central GuildSettings for guildId: ${guildId || "—"}`}
      basicFieldsConfig={basicFieldsConfig}
    />
  );
}
