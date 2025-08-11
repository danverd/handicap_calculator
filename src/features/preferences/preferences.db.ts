import { db } from '@lib/idb'
import type { PreferenceKV } from '@types/index'

export async function setPreference<T>(key: string, value: T): Promise<void> {
  const row: PreferenceKV<T> = { key, value }
  await db.preferences.put(row as PreferenceKV)
}

export async function getPreference<T>(key: string): Promise<T | undefined> {
  const row = await db.preferences.get(key)
  return row?.value as T | undefined
}


