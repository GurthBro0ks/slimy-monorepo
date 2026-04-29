import { ComingSoon } from "@/components/ui/coming-soon";
import { User } from "lucide-react";

export default function PersonalDashboardPage() {
  return (
    <ComingSoon
      title="PERSONAL DASHBOARD"
      description="Track your personal Super Snail progress, achievements, and stats."
      icon={<User size={48} />}
    />
  );
}
