import { MessageSquare } from "lucide-react";
import { LazyChatInterface } from "@/components/lazy";
import { Suspense } from "react";
import { LoadingSpinner } from "@/lib/lazy";

export default function ChatPage() {
  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <MessageSquare className="h-10 w-10 text-neon-green" />
          <div>
            <h1 className="text-4xl font-bold">Slime Chat</h1>
            <p className="text-muted-foreground">
              AI-powered conversations with personality modes
            </p>
          </div>
        </div>

        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <LazyChatInterface />
        </Suspense>
      </div>
    </div>
  );
}
