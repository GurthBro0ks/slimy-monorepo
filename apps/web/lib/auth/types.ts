import type { Role } from "@/slimy.config";

export interface User {
  id: string;
  name: string;
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  installed: boolean;
  roles: string[];
}

export interface AuthUser extends User {
  username: string;
  role: Role;
  guilds?: Guild[];
  sessionGuilds?: Guild[];
  lastActiveGuild?: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: number;
}

export interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
}
