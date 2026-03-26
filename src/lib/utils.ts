import { nanoid } from 'nanoid'

export function createId(): string {
  return nanoid()
}

export function nowISO(): string {
  return new Date().toISOString()
}
