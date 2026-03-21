export type AuthUserAvatar = {
  _id: string;
  tag: string;
  filename: string;
  metadata: {
    type: string;
    width: number;
    height: number;
  };
  content_type: string;
  size: number;
  deleted: boolean;
  reported: boolean;
  message_id?: string;
  server_id?: string;
  object_id?: string;
} | null;

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  avatar: AuthUserAvatar;
  email?: string;
  role: string;
  // Backward compatibility fields that other parts of the app might still use temporarily
  name?: string;
  guilds?: any[];
  sessionGuilds?: any[];
  lastActiveGuild?: any;
};

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: string | null;
  error?: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  refresh?: () => Promise<void>; // Backward compatibility
}
