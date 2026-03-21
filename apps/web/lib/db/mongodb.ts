import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

let client: MongoClient;
let db: Db;

export async function getRevoltDb(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri!, {
      maxPoolSize: 5,
      // Revolt DB is usually on NUC1, we are on NUC2
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });
    await client.connect();
  }

  db = client.db("revolt");
  return db;
}
