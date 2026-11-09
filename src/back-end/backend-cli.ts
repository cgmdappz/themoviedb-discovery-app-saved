import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { Command } from 'commander';
import { initializeDatabase } from './database/schema.ts';

export const DEFAULT_DATABASE_PATH = './data/movies.sqlite';

export type OpenDatabase = (path: string) => DatabaseSync;

export function createCli(
  openDatabase: OpenDatabase = (path) => {
    mkdirSync(dirname(path), { recursive: true });
    return new DatabaseSync(path);
  },
): Command {
  return new Command()
    .name('backend-cli')
    .description('Create and initialize the TMDB movies SQLite database')
    .option('-p, --path <path>', 'SQLite database path', DEFAULT_DATABASE_PATH)
    .action((options: { path: string }) => {
      const databasePath = resolve(options.path);
      const database = openDatabase(databasePath);
      try {
        initializeDatabase(database);
      } finally {
        database.close();
      }
      console.log(`Database initialized at ${databasePath}`);
    });
}

/* c8 ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  createCli().parse();
}
