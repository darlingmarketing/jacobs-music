import { createStore, get, set, del, keys } from "idb-keyval";

const store = createStore("jacobs-music", "kv");

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return get<T>(key, store);
}
export async function kvSet<T>(key: string, value: T): Promise<void> {
  return set(key, value, store);
}
export async function kvDel(key: string): Promise<void> {
  return del(key, store);
}
export async function kvKeys(): Promise<IDBValidKey[]> {
  return keys(store);
}
