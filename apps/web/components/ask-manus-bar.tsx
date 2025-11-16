"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Copy, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ChatAction, ChatResponse } from "@/lib/chat-actions";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Hook to get current page context
const usePageContext = () => {
  const pathname = usePathname();
  return {
    guildId: "mock-guild-123",
    route: pathname,
    role: "user", // Should be fetched from auth context
    filters: {},
    pageSummary: `User is on the ${pathname} page.`,
  };
};

export function AskManusBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const context = usePageContext();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userAsk = input;
    setInput("");
    setResponse(null);
    setError(null);
    setLoading(true);

    try {
      const apiResponse = await fetch("/api/chat/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...context, userAsk }),
      });

      if (apiResponse.status === 429) {
        setError("Rate limit exceeded. Please wait a moment.");
        return;
      }

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        setError(errorData.message || "An unknown error occurred.");
        return;
      }

      const data = await apiResponse.json();
      setResponse(data);
    } catch {
      setError("Network error. Could not connect to the chat service.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: ChatAction) => {
    if (action.type === "copy") {
      navigator.clipboard.writeText(action.value).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    } else if (action.type === "post") {
      // Logic for posting to an endpoint (e.g., submitting a form/report)
      console.log(`Posting to ${action.value} with method ${action.method || "GET"}`);
      // In a real app, this would involve a fetch call
    }
  };

  const renderAction = (action: ChatAction, index: number) => {
    const Icon = action.type === "copy" ? Copy : action.type === "link" ? ExternalLink : Send;

    const buttonProps: {
      variant: "outline" | "neon";
      size: "sm";
      className: string;
      onClick?: () => void;
    } = {
      variant: action.type === "copy" ? "outline" : "neon",
      size: "sm",
      className: "h-8",
      onClick: action.type !== "link" ? () => handleAction(action) : undefined,
    };

    if (action.type === "link") {
      return (
        <Link key={index} href={action.value} target={action.target} passHref>
          <Button {...buttonProps}>
            <Icon className="h-4 w-4 mr-1" />
            {action.label}
          </Button>
        </Link>
      );
    }

    return (
      <Button key={index} {...buttonProps}>
        <Icon className="h-4 w-4 mr-1" />
        {action.label}
      </Button>
    );
  };

  return (
    <>
      {/* Main Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl transition-all duration-300">
          <div className="flex items-center p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="mr-2 h-8 w-8"
            >
              <MessageSquare className="h-5 w-5 text-neon-green" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Ask Manus
            </span>
          </div>
        </Card>
      </div>

      {/* Chat Window */}
      <div
        className={`fixed bottom-20 right-4 z-50 transition-all duration-300 ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <Card className="w-80 shadow-2xl">
          <div className="flex flex-col p-4">
            {/* Response Area */}
            <div className="mb-4 min-h-[100px] max-h-64 overflow-y-auto text-sm">
              {loading && (
                <div className="flex items-center gap-2 text-neon-green">
                  <span className="h-3 w-3 animate-ping rounded-full bg-neon-green"></span>
                  Thinking...
                </div>
              )}
              {error && <p className="text-red-500">{error}</p>}
              {response && (
                <>
                  <p className="mb-3">{response.reply}</p>
                  <div className="flex flex-wrap gap-2">
                    {response.actions.map(renderAction)}
                  </div>
                </>
              )}
              {!loading && !error && !response && (
                <p className="text-muted-foreground">
                  Ask me about codes, stats, or features!
                </p>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={loading}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
              />
              <Button type="submit" size="icon" disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
      
      {/* Copy Notification */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] p-3 rounded-lg bg-neon-green text-black transition-opacity duration-300 ${
          isCopied ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        Copied to clipboard!
      </div>
    </>
  );
}
