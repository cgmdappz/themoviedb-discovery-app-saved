#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { resolve } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';
import { importMovies, parseMoviesCsv } from './database/movies-csv.ts';

/** Command-line interface for movie database operations. */
export type OpenDatabase = (path: string) => DatabaseSync;
export type ReadCsvFile = (path: string) => string;
export type Logger = (message: string) => void;

export function createCli(
  openDatabase: OpenDatabase = getDatabase,
  readCsvFile: ReadCsvFile = (path) => readFileSync(path, 'utf8'),
  logger: Logger = console.log,
): Command {
  const program = new Command()
    .name('backend-cli')
    .description('CLI for movie database operations')
    .option('-p, --path <path>', 'path to the SQLite database file');

  program
    .command('create-database')
    .description('Create and initialize the movies database schema')
    .option('-p, --path <path>', 'path to the SQLite database file')
    .action(({ path }: { path?: string }) => {
      const databasePath = resolve(
        path ?? program.opts<{ path?: string }>().path ?? DEFAULT_DATABASE_PATH,
      );
      const database = openDatabase(databasePath);
      try {
        logger(`Database available at ${databasePath}`);
      } finally {
        database.close();
      }
    });

  program
    .command('import-movies <csv-file>')
    .description('Import or update movies from a CSV file')
    .option('-p, --path <path>', 'path to the SQLite database file')
    .action((csvFile: string, options: { path?: string }) => {
      const movies = parseMoviesCsv(readCsvFile(resolve(csvFile)));
      const databasePath = resolve(
        options.path ??
          program.opts<{ path?: string }>().path ??
          DEFAULT_DATABASE_PATH,
      );
      const database = openDatabase(databasePath);
      try {
        const imported = importMovies(database, movies);
        const noun = imported === 1 ? 'movie' : 'movies';
        logger(`Imported ${imported} ${noun} into ${databasePath}`);
      } finally {
        database.close();
      }
    });

  return program;
}

/* c8 ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  createCli().parse();
}
