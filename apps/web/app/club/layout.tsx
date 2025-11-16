import { AskManusBar } from "@/components/ask-manus-bar";
import { isExperimentEnabled } from "@/lib/feature-flags";

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  // Mock guildId for feature flag check
  const guildId = "web";

  return (
    <>
      {children}
      {isExperimentEnabled(guildId, "askManus") && <AskManusBar />}
    </>
  );
}
