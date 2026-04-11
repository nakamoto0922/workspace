import { config } from 'dotenv'

config()

function readEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export const env = {
  port: Number(process.env.BACKEND_PORT ?? 8787),
  databaseUrl: readEnv(
    'DATABASE_URL',
    'postgres://postgres:postgres@db:5432/appdb',
  ),
  nodeEnv: process.env.NODE_ENV ?? 'development',
}
