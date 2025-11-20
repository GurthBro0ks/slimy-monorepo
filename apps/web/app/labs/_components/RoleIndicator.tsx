import { Badge } from "@/components/ui/badge";
import { Shield, Crown, Zap } from "lucide-react";

interface RoleIndicatorProps {
  role: "admin" | "club" | "user";
  className?: string;
}

export function RoleIndicator({ role, className }: RoleIndicatorProps) {
  const roleConfig = {
    admin: {
      label: "Admin",
      icon: Shield,
      variant: "admin" as const,
    },
    club: {
      label: "Club Member",
      icon: Crown,
      variant: "club" as const,
    },
    user: {
      label: "User",
      icon: Zap,
      variant: "user" as const,
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
