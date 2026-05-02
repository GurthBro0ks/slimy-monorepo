import { getPool, RowDataPacket, ResultSetHeader, FieldPacket } from "@slimy/db";

export function getClubPool() {
  return getPool("CLUB_MYSQL");
}

export async function queryClub<T extends RowDataPacket[]>(
  sql: string,
  values?: unknown[]
): Promise<[T, FieldPacket[]]> {
  const p = getClubPool();
  const connection = await p.getConnection();
  try {
    return await connection.query<T>(sql, values);
  } finally {
    connection.release();
  }
}

export async function executeClub(
  sql: string,
  values?: any[]
): Promise<[ResultSetHeader, FieldPacket[]]> {
  const p = getClubPool();
  const connection = await p.getConnection();
  try {
    return (await connection.execute(sql, values)) as [ResultSetHeader, FieldPacket[]];
  } finally {
    connection.release();
  }
}

export function isClubConfigured(): boolean {
  return !!(
    process.env.CLUB_MYSQL_HOST &&
    process.env.CLUB_MYSQL_USER &&
    process.env.CLUB_MYSQL_PASSWORD
  );
}
