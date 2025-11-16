import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Callout } from "./ui/callout";
import { CopyBox } from "./ui/copy-box";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-8 text-4xl font-bold tracking-tight">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-6 text-3xl font-semibold tracking-tight">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-2xl font-semibold tracking-tight">{children}</h3>
    ),
    p: ({ children }) => <p className="mb-4 leading-7">{children}</p>,
    ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-2">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-2">{children}</ol>,
    li: ({ children }) => <li className="leading-7">{children}</li>,
    a: ({ href, children }) => (
      <Link
        href={href || "#"}
        className="font-medium text-neon-green underline underline-offset-4 hover:text-neon-green/80"
      >
        {children}
      </Link>
    ),
    code: ({ children }) => (
      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="mb-4 overflow-x-auto rounded-lg border bg-muted p-4">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mb-4 border-l-4 border-neon-green pl-4 italic">
        {children}
      </blockquote>
    ),
    Callout,
    CopyBox,
    ...components,
  };
}
