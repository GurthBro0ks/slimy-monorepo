"use client";

import { FormEvent, useState } from "react";

export default function SlimeChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "system", text: "Session resumed." },
    { from: "bot", text: "Welcome back, Admin. System is ready." },
  ]);
  const [input, setInput] = useState("");

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text: input.trim() }]);
    setInput("");
  };

  return (
    <>
      {!open && (
        <button className="widget-toggle" type="button" onClick={() => setOpen(true)} aria-label="Open slime.chat">
          💬
        </button>
      )}

      {open && (
        <div className="chat-interface">
          <div className="aol-titlebar">
            <span>slime.chat - Guild #8841</span>
            <button type="button" className="btn outline" onClick={() => setOpen(false)} style={{ padding: "4px 10px" }}>
              ✕
            </button>
          </div>
          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div key={`${msg.from}-${idx}`} className="chat-message">
                <strong style={{ color: msg.from === "user" ? "var(--neon-pink)" : "var(--neon-green)" }}>
                  {msg.from === "user" ? "You" : "SlimeBot"}:
                </strong>{" "}
                {msg.text}
              </div>
            ))}
          </div>
          <form className="chat-input-row" onSubmit={send}>
            <input
              className="chat-input"
              placeholder="Enter message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              data-test-id="chat-input"
            />
            <button type="submit" className="btn" data-test-id="chat-send">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
