import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getClubPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.CLUB_MYSQL_HOST;
    const port = parseInt(process.env.CLUB_MYSQL_PORT || "3306", 10);
    const user = process.env.CLUB_MYSQL_USER;
    const password = process.env.CLUB_MYSQL_PASSWORD;
    const database = process.env.CLUB_MYSQL_DATABASE || "slimy";

    if (!host || !user || !password) {
      throw new Error(
        "CLUB_MYSQL_HOST, CLUB_MYSQL_USER, and CLUB_MYSQL_PASSWORD must be configured"
      );
    }

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function queryClub<T extends mysql.RowDataPacket[]>(
  sql: string,
  values?: mysql.QueryInput[]
): Promise<[T, mysql.QueryResult]> {
  const p = getClubPool();
  const connection = await p.getConnection();
  try {
    return (await connection.query<T>(sql, values)) as [T, mysql.QueryResult];
  } finally {
    connection.release();
  }
}

export async function executeClub(
  sql: string,
  values?: mysql.QueryInput[]
): Promise<[mysql.ResultSetHeader, mysql.QueryResult]> {
  const p = getClubPool();
  const connection = await p.getConnection();
  try {
    return (await connection.execute(sql, values)) as [
      mysql.ResultSetHeader,
      mysql.QueryResult,
    ];
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
