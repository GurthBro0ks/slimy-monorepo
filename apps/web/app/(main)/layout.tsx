import { AuthProvider } from "@/lib/auth/context";
import { ChatProvider } from "@/components/retro-chat/chat-context";
import { RetroShell } from "@/components/layout/retro-shell";
import { AppShell } from "@/components/layout/app-shell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <RetroShell>
          <AppShell>{children}</AppShell>
        </RetroShell>
      </ChatProvider>
    </AuthProvider>
  );
}
