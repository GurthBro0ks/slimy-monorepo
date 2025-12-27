"use client";

import { SettingsEditor, type BasicFieldConfig } from "@/components/settings/SettingsEditor";
import { ActiveClubPickerCard } from "@/components/settings/ActiveClubPickerCard";

export default function SettingsPage() {
  const basicFieldsConfig: BasicFieldConfig[] = [
    {
      id: "theme",
      label: "Theme",
      kind: "select",
      options: [
        { value: "", label: "(unset)" },
        { value: "system", label: "system" },
        { value: "neon", label: "neon" },
        { value: "classic", label: "classic" },
      ],
      getValue: (settings) => (typeof settings?.prefs?.theme === "string" ? settings.prefs.theme : ""),
      apply: (draft, next) => {
        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        if (!next) delete draft.prefs.theme;
        else draft.prefs.theme = next;
      },
    },
    {
      id: "chat_markdown",
      label: "Chat markdown",
      kind: "select",
      options: [
        { value: "unset", label: "(unset)" },
        { value: "true", label: "enabled" },
        { value: "false", label: "disabled" },
      ],
      getValue: (settings) => {
        const v = settings?.prefs?.chat?.markdown;
        return typeof v === "boolean" ? (v ? "true" : "false") : "unset";
      },
      apply: (draft, next) => {
        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        const chat = typeof draft.prefs.chat === "object" && draft.prefs.chat ? { ...draft.prefs.chat } : {};
        if (next === "unset") delete chat.markdown;
        else chat.markdown = next === "true";
        if (Object.keys(chat).length) draft.prefs.chat = chat;
        else delete draft.prefs.chat;
      },
    },
    {
      id: "chat_profanity",
      label: "Profanity filter",
      kind: "select",
      options: [
        { value: "unset", label: "(unset)" },
        { value: "true", label: "enabled" },
        { value: "false", label: "disabled" },
      ],
      getValue: (settings) => {
        const v = settings?.prefs?.chat?.profanityFilter;
        return typeof v === "boolean" ? (v ? "true" : "false") : "unset";
      },
      apply: (draft, next) => {
        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        const chat = typeof draft.prefs.chat === "object" && draft.prefs.chat ? { ...draft.prefs.chat } : {};
        if (next === "unset") delete chat.profanityFilter;
        else chat.profanityFilter = next === "true";
        if (Object.keys(chat).length) draft.prefs.chat = chat;
        else delete draft.prefs.chat;
      },
    },
    {
      id: "snail_avatarId",
      label: "Snail avatarId",
      kind: "text",
      getValue: (settings) => (typeof settings?.prefs?.snail?.avatarId === "string" ? settings.prefs.snail.avatarId : ""),
      apply: (draft, next) => {
        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        const snail = typeof draft.prefs.snail === "object" && draft.prefs.snail ? { ...draft.prefs.snail } : {};
        if (!next) delete snail.avatarId;
        else snail.avatarId = next;
        if (Object.keys(snail).length) draft.prefs.snail = snail;
        else delete draft.prefs.snail;
      },
    },
    {
      id: "snail_vibe",
      label: "Snail vibe",
      kind: "text",
      getValue: (settings) => (typeof settings?.prefs?.snail?.vibe === "string" ? settings.prefs.snail.vibe : ""),
      apply: (draft, next) => {
        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        const snail = typeof draft.prefs.snail === "object" && draft.prefs.snail ? { ...draft.prefs.snail } : {};
        if (!next) delete snail.vibe;
        else snail.vibe = next;
        if (Object.keys(snail).length) draft.prefs.snail = snail;
        else delete draft.prefs.snail;
      },
    },
    {
      id: "snail_loreFlags",
      label: "Snail loreFlags (comma-separated)",
      kind: "text",
      placeholder: "flag_one, flag_two",
      getValue: (settings) => {
        const flags = Array.isArray(settings?.prefs?.snail?.loreFlags)
          ? settings.prefs.snail.loreFlags.filter((v: any) => typeof v === "string")
          : [];
        return flags.join(", ");
      },
      apply: (draft, next) => {
        const flags = String(next || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        draft.prefs = typeof draft.prefs === "object" && draft.prefs ? { ...draft.prefs } : {};
        const snail = typeof draft.prefs.snail === "object" && draft.prefs.snail ? { ...draft.prefs.snail } : {};
        if (!flags.length) delete snail.loreFlags;
        else snail.loreFlags = flags;
        if (Object.keys(snail).length) draft.prefs.snail = snail;
        else delete draft.prefs.snail;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <ActiveClubPickerCard />
      <SettingsEditor
        scopeType="user"
        title="User Settings"
        description="Central UserSettings for your account."
        basicFieldsConfig={basicFieldsConfig}
      />
    </div>
  );
}
