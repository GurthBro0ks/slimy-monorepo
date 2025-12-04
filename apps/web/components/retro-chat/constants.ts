import type { UserGroup } from './types';

export const INITIAL_HISTORY: Record<string, string> = {
   'Lounge': '<div class="msg-line"><span class="msg-timestamp">12:00 AM</span><span class="msg-user text-guild">L8rSk8r:</span> <span class="msg-text">Is the server lagging?</span></div>',
   'Club': '<div class="msg-line"><span class="msg-timestamp">11:55 PM</span><span class="msg-user text-club">System:</span> <span class="msg-text">Welcome to the Club.</span></div>',
   'Admin': '<div class="msg-line"><span class="msg-timestamp">09:00 AM</span><span class="msg-user text-admin">System:</span> <span class="msg-text">Log started.</span></div>'
};

export const USER_GROUPS: UserGroup[] = [
   {
      name: "Admin",
      count: "7",
      color: "text-admin",
      users: [
         { name: "(X)yth", status: "online" },
         { name: "Gurth Brooks", status: "online" },
         { name: "Stone", status: "online" },
         { name: "SysOp_Zero", status: "offline" },
         { name: "Net_Ghost", status: "offline" },
         { name: "Root_Access", status: "offline" },
         { name: "Mainframe_X", status: "offline" }
      ]
   },
   {
      name: "Club",
      count: "25",
      color: "text-club",
      users: [
         { name: "CoolDude99", status: "online" },
         { name: "MallRat_X", status: "online" },
         { name: "Partier1", status: "offline" },
         { name: "Partier2", status: "offline" }
      ]
   },
   {
      name: "Guild",
      count: "56",
      color: "text-guild",
      users: [
         { name: "L8rSk8r", status: "online" },
         { name: "NetSurfer", status: "online" },
         { name: "Elf_Ranger", status: "offline" },
         { name: "Orc_Slayer", status: "offline" }
      ]
   }
];

export const EMOJIS = {
   snailPack: ['🐌😎', '🐌❤️', '🐌💧', '🐌💤', '🐌😵', '🐌💕', '🐌😫', '🐌🤔', '🐌😯', '🐌👍', '🐌😠', '🐌✨'],
   retroPixels: ['😂', '❤️', '👽', '👍', '🍕', '👻', '👎', '💩', '💣', '💋', '💀', '🤩']
};

export const COLORS = ['white', 'black', 'red', 'lime', 'blue', 'yellow', 'cyan', 'magenta', '#800000', '#008000', '#000080', '#808000', '#008080', '#800080', '#c0c0c0', '#808080'];

export const CURRENT_USER = "(X)yth";
