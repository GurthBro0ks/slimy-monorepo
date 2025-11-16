"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface CopyBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  label?: string;
}

export function CopyBox({ content, label = "Copy", className, ...props }: CopyBoxProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative rounded-md border bg-muted/50 p-4 font-mono text-sm",
        className
      )}
      {...props}
    >
      <pre className="overflow-x-auto whitespace-pre-wrap break-all">
        {content}
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute right-2 top-2"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            <span className="ml-1">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span className="ml-1">{label}</span>
          </>
        )}
      </Button>
    </div>
  );
}
