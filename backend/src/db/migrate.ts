import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from './client.js'

async function main() {
  await migrate(db, {
    migrationsFolder: 'drizzle',
  })
}

main()
  .then(() => {
    console.log('Database migrations applied.')
  })
  .catch((error) => {
    console.error('Failed to apply database migrations.')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
