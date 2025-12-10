import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "";

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<Db> | null = null;

export const getDb = async (): Promise<Db | null> => {
  if (!uri) return null;
  if (db) return db;
  if (connecting) return connecting;

  connecting = (async () => {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(); // use default DB from URI
    return db;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
};

export const getClient = async (): Promise<MongoClient | null> => {
  if (!uri) return null;
  if (client) return client;
  await getDb();
  return client;
};

