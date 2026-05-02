export {
  createDbPool,
  getPool,
  destroyPool,
  query,
} from "./pool";

export type {
  DbConfig,
  QueryResult,
  RowDataPacket,
  ResultSetHeader,
  FieldPacket,
} from "./types";
