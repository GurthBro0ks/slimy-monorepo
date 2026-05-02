import type { RowDataPacket, ResultSetHeader, FieldPacket } from "mysql2/promise";

export type { RowDataPacket, ResultSetHeader, FieldPacket };

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  waitForConnections?: boolean;
  queueLimit?: number;
}

export type QueryResult<T extends RowDataPacket[] | ResultSetHeader = RowDataPacket[]> = [T, FieldPacket[]];
