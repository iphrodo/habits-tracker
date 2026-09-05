import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

const database = process.env.NUXT_DATABASE_PATH
const backupDirectory = process.env.VILNO_BACKUP_DIR
if (!database || !backupDirectory) throw new Error('Set NUXT_DATABASE_PATH and VILNO_BACKUP_DIR.')
if (!existsSync(database)) throw new Error('SQLite database does not exist.')
mkdirSync(backupDirectory, { recursive: true })
const filename = `${basename(database, '.sqlite')}-${new Date().toISOString().replaceAll(':', '-')}.sqlite`
const destination = join(backupDirectory, filename)
// Run while the app is stopped, or replace this script with your platform's SQLite Online Backup API job.
copyFileSync(database, destination)
const backups = readdirSync(backupDirectory).filter((name) => name.endsWith('.sqlite')).sort().reverse()
for (const old of backups.slice(7)) rmSync(join(backupDirectory, old))
console.log(destination)
