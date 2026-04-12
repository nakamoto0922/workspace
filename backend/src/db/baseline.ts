import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pool } from './client.js'

type JournalEntry = {
  tag: string
  when: number
}

type Journal = {
  entries: JournalEntry[]
}

function readTargetTag() {
  const targetTag = process.argv[2]
  if (!targetTag) {
    throw new Error(
      'Missing baseline target tag. Example: npm run db:baseline --workspace backend -- 0000_watery_morgan_stark',
    )
  }

  return targetTag
}

async function readJournal() {
  const journalPath = path.resolve(process.cwd(), 'drizzle/meta/_journal.json')
  const raw = await readFile(journalPath, 'utf8')
  return JSON.parse(raw) as Journal
}

async function readMigrationHash(tag: string) {
  const filePath = path.resolve(process.cwd(), 'drizzle', `${tag}.sql`)
  const sql = await readFile(filePath, 'utf8')
  return createHash('sha256').update(sql).digest('hex')
}

async function main() {
  const targetTag = readTargetTag()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query('CREATE SCHEMA IF NOT EXISTS drizzle')
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `)

    const existing = await client.query<{
      id: number
      hash: string
      created_at: string | null
    }>('select id, hash, created_at from drizzle.__drizzle_migrations order by created_at asc')

    if (existing.rowCount && existing.rowCount > 0) {
      console.log('Drizzle migration history already exists. Skipping baseline.')
      await client.query('COMMIT')
      return
    }

    const journal = await readJournal()
    const targetIndex = journal.entries.findIndex((entry) => entry.tag === targetTag)

    if (targetIndex === -1) {
      throw new Error(`Unknown migration tag: ${targetTag}`)
    }

    const entriesToInsert = journal.entries.slice(0, targetIndex + 1)

    for (const entry of entriesToInsert) {
      const hash = await readMigrationHash(entry.tag)
      await client.query(
        'insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)',
        [hash, entry.when],
      )
    }

    await client.query('COMMIT')
    console.log(
      `Inserted ${entriesToInsert.length} baseline migration entries through ${targetTag}.`,
    )
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Failed to baseline drizzle migration history.')
  console.error(error)
  process.exitCode = 1
})
