import { getRevoltDb } from "./mongodb";

export interface UserServer {
  serverId: string;
  serverName: string;
  serverIcon?: {
    _id: string;
    tag: string;
    filename: string;
  } | null;
  joinedAt: number;
  userRoles: string[];
}

export interface ServerDetails {
  _id: string;
  owner: string;
  name: string;
  icon?: {
    _id: string;
    tag: string;
    filename: string;
  } | null;
  channels: string[];
  default_permissions: number;
  description?: string;
  banner?: any;
  flags?: number;
  nsfw?: boolean;
}

export interface ServerMember {
  userId: string;
  username: string;
  displayName?: string;
  avatar?: any;
  joinedAt: number;
  roles: string[];
}

export async function getUserServers(userId: string): Promise<UserServer[]> {
  const db = await getRevoltDb();
  
  // 1. Find all memberships for this user
  const memberships = await db.collection("server_members")
    .find({ "_id.user": userId })
    .toArray();

  if (memberships.length === 0) return [];

  const serverIds = memberships.map(m => (m as unknown as { _id: { server: string } })._id.server);

  // 2. Fetch server details
  const servers = await db.collection("servers")
    .find({ _id: { $in: serverIds } } as unknown as Record<string, unknown>)
    .toArray();

  // 3. Join data
  return servers.map(server => {
    const s = server as unknown as { _id: string; name: string; icon?: UserServer['serverIcon'] };
    const membership = memberships.find(m => (m as unknown as { _id: { server: string } })._id.server === s._id);
    const m = membership as unknown as { joined_at?: number; roles?: string[] } | undefined;
    return {
      serverId: s._id,
      serverName: s.name,
      serverIcon: s.icon,
      joinedAt: m?.joined_at || 0,
      userRoles: m?.roles || [],
    };
  });
}

export async function getServerDetails(serverId: string): Promise<ServerDetails | null> {
  const db = await getRevoltDb();
  const server = await db.collection("servers").findOne({ _id: serverId } as unknown as Record<string, unknown>);
  return server as ServerDetails | null;
}

export async function validateServerMembership(userId: string, serverId: string): Promise<boolean> {
  const db = await getRevoltDb();
  const membership = await db.collection("server_members").findOne({
    "_id.server": serverId,
    "_id.user": userId
  });
  return !!membership;
}

export async function getServerMembers(serverId: string): Promise<ServerMember[]> {
  const db = await getRevoltDb();
  
  const members = await db.collection("server_members")
    .find({ "_id.server": serverId })
    .toArray();

  const userIds = members.map(m => (m as unknown as { _id: { user: string } })._id.user);
  const users = await db.collection("users")
    .find({ _id: { $in: userIds } } as unknown as Record<string, unknown>)
    .toArray();

  return members.map(member => {
    const m = member as unknown as { _id: { user: string }; joined_at?: number; roles?: string[] };
    const user = users.find(u => (u as unknown as { _id: string })._id === m._id.user);
    const u = user as unknown as { username?: string; display_name?: string; avatar?: unknown } | undefined;
    return {
      userId: m._id.user,
      username: u?.username || "Unknown",
      displayName: u?.display_name,
      avatar: u?.avatar,
      joinedAt: m.joined_at || 0,
      roles: m.roles || [],
    };
  });
}
