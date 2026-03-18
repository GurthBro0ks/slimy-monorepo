import { AskManusBar } from "@/components/ask-manus-bar";
import { isExperimentEnabled } from "@/lib/feature-flags";
import { AuthProvider } from "@/lib/auth/context";
import { ChatProvider } from "@/components/retro-chat/chat-context";

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  // Mock guildId for feature flag check
  const guildId = "web";

  return (
    <AuthProvider>
      <ChatProvider>
        <>
          {children}
          {isExperimentEnabled(guildId, "askManus") && <AskManusBar />}
        </>
      </ChatProvider>
    </AuthProvider>
  );
}
