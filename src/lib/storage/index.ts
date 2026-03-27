import { localStorageAdapter } from './localStorageAdapter'
import type { StorageAdapter } from './adapter'

let _storage: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (_storage) return _storage

  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabaseAdapter } = require('./supabaseAdapter') as { supabaseAdapter: StorageAdapter }
    _storage = supabaseAdapter
    return _storage
  }

  _storage = localStorageAdapter
  return _storage
}
