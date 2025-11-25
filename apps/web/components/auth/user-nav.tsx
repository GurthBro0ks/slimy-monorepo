"use client";

import Image from "next/image";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BasicUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  globalName?: string | null;
  avatar?: string | null;
  email?: string | null;
  role?: string | null;
};

interface UserNavProps {
  user: BasicUser;
  onLogout?: () => void;
  loading?: boolean;
}

function getDisplayName(user: BasicUser) {
  return (
    user.name ||
    user.globalName ||
    user.username ||
    user.email ||
    "User"
  );
}

function getAvatarUrl(user: BasicUser) {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}

export function UserNav({ user, onLogout, loading = false }: UserNavProps) {
  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayName(user);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-muted">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-sm font-medium text-foreground">
            {displayName}
          </span>
          {user.role && (
            <span className="text-xs uppercase text-muted-foreground">
              {user.role}
            </span>
          )}
        </div>
      </div>

      {onLogout && (
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          disabled={loading}
          className={cn("text-muted-foreground hover:text-foreground")}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span className="ml-1 hidden sm:inline">
            {loading ? "Logging out..." : "Logout"}
          </span>
        </Button>
      )}
    </div>
  );
}

