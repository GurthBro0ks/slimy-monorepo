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

  const serverIds = memberships.map(m => m._id.server);

  // 2. Fetch server details
  const servers = await db.collection("servers")
    .find({ _id: { $in: serverIds } })
    .toArray();

  // 3. Join data
  return servers.map(server => {
    const membership = memberships.find(m => m._id.server === server._id);
    return {
      serverId: server._id,
      serverName: server.name,
      serverIcon: server.icon,
      joinedAt: membership?.joined_at || 0,
      userRoles: membership?.roles || [],
    };
  });
}

export async function getServerDetails(serverId: string): Promise<ServerDetails | null> {
  const db = await getRevoltDb();
  const server = await db.collection("servers").findOne({ _id: serverId });
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

  const userIds = members.map(m => m._id.user);
  const users = await db.collection("users")
    .find({ _id: { $in: userIds } })
    .toArray();

  return members.map(member => {
    const user = users.find(u => u._id === member._id.user);
    return {
      userId: member._id.user,
      username: user?.username || "Unknown",
      displayName: user?.display_name,
      avatar: user?.avatar,
      joinedAt: member.joined_at,
      roles: member.roles || [],
    };
  });
}
