export const roleMap = {
  admin: ['1178129227321712701', '1216250443257217124'], // @Admin, @Managers
  club: ['1178143391884775444'], // @CormysBar
} as const;

export type Role = keyof typeof roleMap | 'user';

export function getUserRole(guildRoles?: string[]): Role {
  if (!guildRoles) return 'user';
  
  for (const [role, roleIds] of Object.entries(roleMap)) {
    if (roleIds.some(id => guildRoles.includes(id))) {
      return role as Role;
    }
  }
  
  return 'user';
}

export function getRoleRoute(role: Role): string {
  switch (role) {
    case 'admin':
      return '/guilds';
    case 'club':
      return '/club';
    default:
      return '/snail';
  }
}
