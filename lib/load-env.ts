import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return

  const content = readFileSync(filePath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

/** Load .env.local then .env (Next.js convention). */
export function loadEnv(): void {
  const root = process.cwd()
  loadEnvFile(resolve(root, '.env.local'))
  loadEnvFile(resolve(root, '.env'))
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and set your Supabase credentials.`
    )
  }
  return value
}
