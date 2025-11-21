"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { MessageSquare } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "system",
      content: "Slimy chat is in sandbox mode. Messages are not sent to the AI yet.",
      ts: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const now = new Date().toLocaleTimeString();
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      ts: now,
    };

    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    // TODO: Replace this with real admin-api call later.
    await new Promise((r) => setTimeout(r, 400));
    const fakeReply: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "This is a placeholder reply. Once the admin API and OpenAI integration are wired, this will stream real responses.",
      ts: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, fakeReply]);
    setIsSending(false);
  }

  const sidebar = (
    <div className="space-y-3">
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          What is this?
        </h2>
        <p className="text-xs text-slate-400">
          Generic Slimy chat UI. Backend pieces like sessions, OpenAI calls,
          and logging will plug in later.
        </p>
      </div>
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          Wiring checklist
        </h2>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Admin API base URL configured</li>
          <li>Discord OAuth returns a valid session</li>
          <li>Chat endpoint exposed from admin API</li>
          <li>HTTP client wrapper handles errors + retries</li>
        </ul>
      </div>
    </div>
  );

  const status = (
    <>
      <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
      <span>Sandbox mode – chat not yet connected to admin-api</span>
    </>
  );

  return (
    <PageShell
      icon={<MessageSquare className="h-6 w-6 text-neon-green" />}
      title="Chat"
      subtitle="Talk to Slimy. UI is ready; backend wiring comes later."
      primaryAction={
        <button
          type="button"
          className="rounded-md bg-neon-green px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-lime-green"
        >
          Settings
        </button>
      }
      status={status}
      sidebar={sidebar}
    >
      <div className="flex flex-col h-[70vh] border border-slate-800 rounded-lg bg-slate-900/60">
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-snug ${
                m.role === "user"
                  ? "ml-auto bg-neon-green text-slate-900"
                  : m.role === "assistant"
                  ? "mr-auto bg-slate-800 text-slate-50"
                  : "mx-auto bg-slate-900 text-slate-400 text-[11px]"
              }`}
            >
              <div className="mb-0.5 opacity-60 text-[10px]">
                {m.role.toUpperCase()} • {m.ts}
              </div>
              <div>{m.content}</div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-slate-800 bg-slate-950/60 p-2 flex gap-2"
        >
          <input
            className="flex-1 bg-slate-900 text-xs text-slate-100 rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-neon-green"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="rounded-md bg-neon-green px-3 py-2 text-xs font-medium text-slate-900 disabled:opacity-40"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
