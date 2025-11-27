import type { Role } from "@/slimy.config";

export interface User {
  id: string;
  name: string;
}

export interface Guild {
  id: string;
  roles: string[];
}

export interface AuthUser extends User {
  role: Role;
  guilds?: Guild[];
  lastActiveGuild?: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  lastRefresh: number;
}

export interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
}
