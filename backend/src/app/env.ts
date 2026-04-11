import { config } from 'dotenv'

config()

function readEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

function readFrontendOrigins() {
  return [
    process.env.FRONTEND_ORIGIN ?? 'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://[::1]:3000',
  ].filter((value, index, values) => values.indexOf(value) === index)
}

export const env = {
  port: Number(process.env.BACKEND_PORT ?? 8787),
  frontendOrigins: readFrontendOrigins(),
  databaseUrl: readEnv(
    'DATABASE_URL',
    'postgres://postgres:postgres@db:5432/appdb',
  ),
  nodeEnv: process.env.NODE_ENV ?? 'development',
}
