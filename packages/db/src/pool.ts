import mysql, { Pool } from "mysql2/promise";
import { DbConfig, QueryResult, RowDataPacket, ResultSetHeader } from "./types";

const pools = new Map<string, Pool>();

export function createDbPool(config: DbConfig): Pool {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: config.waitForConnections ?? true,
    connectionLimit: config.connectionLimit ?? 10,
    queueLimit: config.queueLimit ?? 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000,
    multipleStatements: false,
  });
}

function envVar(name: string): string | undefined {
  return process.env[name];
}

function buildConfigFromEnv(prefix?: string): DbConfig {
  const p = prefix ? `${prefix}_` : "DB_";
  const host = envVar(`${p}HOST`);
  const user = envVar(`${p}USER`);
  const password = envVar(`${p}PASSWORD`);
  const database = envVar(`${p}DATABASE`) || envVar(`${p}NAME`);
  const port = parseInt(envVar(`${p}PORT`) || "3306", 10);

  if (!host || !user || !password || !database) {
    const required = [`${p}HOST`, `${p}USER`, `${p}PASSWORD`, `${p}DATABASE|${p}NAME`];
    throw new Error(
      `Database not configured. Missing one or more env vars: ${required.join(", ")}`
    );
  }

  return {
    host,
    port,
    user,
    password,
    database,
    connectionLimit: parseInt(envVar(`${p}CONNECTION_LIMIT`) || "10", 10),
    waitForConnections: envVar(`${p}WAIT_FOR_CONNECTIONS`) !== "false",
    queueLimit: parseInt(envVar(`${p}QUEUE_LIMIT`) || "0", 10),
  };
}

export function getPool(prefix?: string): Pool {
  const key = prefix || "DB";
  const existing = pools.get(key);
  if (existing) return existing;

  const config = buildConfigFromEnv(prefix);
  const pool = createDbPool(config);
  pools.set(key, pool);
  console.log(`[@slimy/db] Connection pool initialized (${key})`);
  return pool;
}

export function destroyPool(prefix?: string): Promise<void> {
  const key = prefix || "DB";
  const pool = pools.get(key);
  if (!pool) return Promise.resolve();
  pools.delete(key);
  return pool.end();
}

export async function query<T extends RowDataPacket[]>(
  pool: Pool,
  sql: string,
  values?: unknown[]
): Promise<QueryResult<T>>;
export async function query<T extends ResultSetHeader>(
  pool: Pool,
  sql: string,
  values?: unknown[]
): Promise<QueryResult<T>>;
export async function query<T extends RowDataPacket[] | ResultSetHeader>(
  pool: Pool,
  sql: string,
  values?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(sql, values) as Promise<QueryResult<T>>;
}
