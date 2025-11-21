import { MessageSquare } from "lucide-react";
import { LazyChatInterface } from "@/components/lazy";
import { Suspense } from "react";
import { LoadingSpinner } from "@/lib/lazy";
import { PageShell } from "@/components/layout/page-shell";
import { ConnectionBadge } from "@/components/status/connection-badge";

export default function ChatPage() {
  return (
    <PageShell
      icon={MessageSquare}
      title="Slime Chat"
      subtitle="AI-powered conversations with personality modes"
      status={<ConnectionBadge />}
    >
      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <LazyChatInterface />
      </Suspense>
    </PageShell>
  );
}
