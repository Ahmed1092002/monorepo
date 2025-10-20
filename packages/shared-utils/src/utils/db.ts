import { openDB, type IDBPDatabase } from "idb";

type DatabaseValue = unknown;

const DATABASE_NAME = "erb-pos-db";
const DATABASE_VERSION = 1;
const STORE_NAME = "kv";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function set(key: string, value: DatabaseValue): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, value, key);
}

export async function get<T = DatabaseValue>(key: string): Promise<T | null> {
  const db = await getDb();
  const value = (await db.get(STORE_NAME, key)) as T | undefined;
  return (value as T) ?? null;
}

export async function del(key: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, key);
}

export async function clear(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAME);
}

export async function keys(): Promise<string[]> {
  const db = await getDb();
  const allKeys: string[] = [];
  let cursor = await db.transaction(STORE_NAME).store.openKeyCursor();
  while (cursor) {
    allKeys.push(String(cursor.key));
    cursor = await cursor.continue();
  }
  return allKeys;
}
