// Lightweight stub to avoid pulling MongoDB dependency; returns null so callers
// can no-op when no database is configured.
export type Db = null;
export type MongoClient = null;

export const getDb = async (): Promise<Db> => null;
export const getClient = async (): Promise<MongoClient> => null;

