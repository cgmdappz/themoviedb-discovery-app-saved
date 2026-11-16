#!/usr/bin/env node
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Command } from 'commander';
import { GenreRepository } from './database/genre-repository.ts';
import { parseGenresCsv } from './database/genres-csv.ts';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';

export { DEFAULT_DATABASE_PATH };

export type OpenDatabase = (path: string) => DatabaseSync;
export type Logger = (message: string) => void;

function runTransaction(database: DatabaseSync, operation: () => void): void {
  database.exec('BEGIN IMMEDIATE');
  try {
    operation();
    database.exec('COMMIT');
  } catch (error) {
    try {
      database.exec('ROLLBACK');
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        'Genre operation failed and its transaction could not be rolled back.',
      );
    }
    throw error;
  }
}

function withDatabase(
  path: string,
  openDatabase: OpenDatabase,
  operation: (database: DatabaseSync) => number,
  logger: Logger,
  message: (count: number, path: string) => string,
): void {
  const database = openDatabase(path);
  try {
    const count = operation(database);
    logger(message(count, path));
  } finally {
    database.close();
  }
}

export function createCli(
  openDatabase: OpenDatabase = (path) => {
    mkdirSync(dirname(path), { recursive: true });
    return getDatabase(path);
  },
  logger: Logger = console.log,
): Command {
  const cli = new Command()
    .name('backend-cli')
    .description('Create and manage the TMDB movies SQLite database')
    .option('-p, --path <path>', 'SQLite database path', DEFAULT_DATABASE_PATH);

  cli
    .command('create-database')
    .description('Create and initialize the movies database schema')
    .option('-p, --path <path>', 'path to the SQLite database file')
    .action((options: { path?: string }) => {
      const path = options.path ?? cli.opts<{ path: string }>().path;
      const database = openDatabase(resolve(path));
      try {
        logger(`Database available at ${resolve(path)}`);
      } finally {
        database.close();
      }
    });

  cli
    .command('add-genres <csv-file>')
    .description('Import or update genres from a CSV file')
    .action((csvFile: string) => {
      const genres = parseGenresCsv(readFileSync(resolve(csvFile), 'utf8'));
      const databasePath = resolve(cli.opts<{ path: string }>().path);

      withDatabase(
        databasePath,
        openDatabase,
        (database) => {
          let imported = 0;
          runTransaction(database, () => {
            new GenreRepository(database).saveAll(genres);
            imported = genres.length;
          });
          return imported;
        },
        logger,
        (count, path) => `Imported ${count} genres into ${path}`,
      );
    });

  cli
    .command('clean-genres')
    .description('Delete genres that are not associated with a movie')
    .action(() => {
      const databasePath = resolve(cli.opts<{ path: string }>().path);

      withDatabase(
        databasePath,
        openDatabase,
        (database) => {
          let deleted = 0;
          runTransaction(database, () => {
            deleted = new GenreRepository(database).deleteUnused();
          });
          return deleted;
        },
        logger,
        (count, path) => `Deleted ${count} unused genres from ${path}`,
      );
    });

  return cli;
}

/* c8 ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  createCli().parse();
}
