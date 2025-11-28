export type Theme = 'neon' | 'high-contrast' | 'classic';
export type TextSize = 'small' | 'medium' | 'large';
export type UserStatus = 'online' | 'offline' | 'away';

export interface ChatMessage {
   id: number;
   time: string;
   user: string;
   text: string;
   color: string;
   type: 'msg' | 'system';
}

export interface User {
   name: string;
   status: UserStatus;
}

export interface UserGroup {
   name: string;
   count: string;
   color: string;
   users: User[];
}

export interface UserProfile {
   status: string;
   quote: string;
}

export interface AwayMessage {
   id: number;
   title: string;
   text: string;
}

export interface Settings {
   theme: Theme;
   sounds: boolean;
   top: boolean;
}
