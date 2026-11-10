import { readFileSync, mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { Command } from 'commander';
import { GenreRepository } from './database/genre-repository.ts';
import { parseGenresCsv } from './database/genres-csv.ts';
import { initializeDatabase } from './database/schema.ts';

export const DEFAULT_DATABASE_PATH = './data/movies.sqlite';

export type OpenDatabase = (path: string) => DatabaseSync;
export type Logger = (message: string) => void;

function getDatabasePath(command: Command): string {
  return resolve(command.opts<{ path: string }>().path);
}

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

function openDatabaseAtPath(
  path: string,
  openDatabase: OpenDatabase,
  operation: (database: DatabaseSync) => number,
  logger: Logger,
  message: (count: number, path: string) => string,
): void {
  const database = openDatabase(path);
  try {
    const genreTable = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'genre'",
      )
      .get();
    if (!genreTable) initializeDatabase(database);
    const count = operation(database);
    logger(message(count, path));
  } finally {
    database.close();
  }
}

export function createCli(
  openDatabase: OpenDatabase = (path) => {
    mkdirSync(dirname(path), { recursive: true });
    return new DatabaseSync(path);
  },
  logger: Logger = console.log,
): Command {
  const cli = new Command()
    .name('backend-cli')
    .description('Create and manage the TMDB movies SQLite database')
    .option('-p, --path <path>', 'SQLite database path', DEFAULT_DATABASE_PATH)
    .action((options: { path: string }) => {
      const databasePath = resolve(options.path);
      const database = openDatabase(databasePath);
      try {
        initializeDatabase(database);
      } finally {
        database.close();
      }
      logger(`Database initialized at ${databasePath}`);
    });

  cli
    .command('add-genres <csv-file>')
    .description('Import or update genres from a CSV file')
    .action((csvFile: string) => {
      const genres = parseGenresCsv(readFileSync(resolve(csvFile), 'utf8'));
      const databasePath = getDatabasePath(cli);

      openDatabaseAtPath(
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
      const databasePath = getDatabasePath(cli);

      openDatabaseAtPath(
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
