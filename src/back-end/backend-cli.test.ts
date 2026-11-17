import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DATABASE_PATH, initializeSchema } from './database/schema.ts';
import { MovieRepository } from './database/movie-repository.ts';
import { createCli } from './backend-cli.ts';

const HEADER =
  'id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime_minutes,budget,revenue,collected_at';
const CSV = `${HEADER}\n1,Film,Film,en,Overview,2020-01-02,1.5,7,30,,,120,1000,2000,2026-11-17T10:00:00.000Z`;

const databases: Array<{
  database: DatabaseSync;
  close: ReturnType<typeof vi.spyOn>;
}> = [];

afterEach(() => {
  for (const { database, close } of databases.splice(0)) {
    close.mockRestore();
    database.close();
  }
});

function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  initializeSchema(database);
  const close = vi.spyOn(database, 'close').mockImplementation(() => {});
  databases.push({ database, close });
  return database;
}

async function runCli(
  args: string[],
  openDatabase: (path: string) => DatabaseSync,
  readCsvFile: (path: string) => string,
  logger: (message: string) => void,
): Promise<void> {
  const cli = createCli(openDatabase, readCsvFile, logger);
  cli.exitOverride();
  await cli.parseAsync(args, { from: 'user' });
}

describe('backend-cli import-movies', () => {
  it('uses the default command dependencies with the supplied sample CSV', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-csv-cli-'));
    const databasePath = join(directory, 'movies.sqlite');
    const logger = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      await createCli().parseAsync(
        ['import-movies', resolve('data/movies.csv'), '--path', databasePath],
        { from: 'user' },
      );

      const database = new DatabaseSync(databasePath);
      try {
        expect(new MovieRepository(database).findAll()).toHaveLength(2);
      } finally {
        database.close();
      }
      expect(logger).toHaveBeenCalledWith(
        `Imported 2 movies into ${databasePath}`,
      );
    } finally {
      logger.mockRestore();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('imports movies, updates a custom database and closes the connection', async () => {
    const database = createDatabase();
    const openDatabase = vi.fn(() => database);
    const readCsvFile = vi.fn(() => CSV);
    const logger = vi.fn();

    await runCli(
      [
        'import-movies',
        './data/movies.csv',
        '--path',
        './data/custom-movies.sqlite',
      ],
      openDatabase,
      readCsvFile,
      logger,
    );

    expect(readCsvFile).toHaveBeenCalledWith(
      expect.stringMatching(/data\/movies\.csv$/),
    );
    expect(openDatabase).toHaveBeenCalledWith(
      expect.stringMatching(/data\/custom-movies\.sqlite$/),
    );
    expect(new MovieRepository(database).findById(1)?.title).toBe('Film');
    expect(logger).toHaveBeenCalledWith(
      expect.stringMatching(/^Imported 1 movie into .*custom-movies\.sqlite$/),
    );
    expect(databases[0]?.close).toHaveBeenCalledOnce();
  });

  it('uses the default database path and reports an empty import', async () => {
    const database = createDatabase();
    const openDatabase = vi.fn(() => database);
    const logger = vi.fn();

    await runCli(
      ['import-movies', './data/movies.csv'],
      openDatabase,
      () => HEADER,
      logger,
    );

    expect(openDatabase).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
    expect(logger).toHaveBeenCalledWith(
      `Imported 0 movies into ${DEFAULT_DATABASE_PATH}`,
    );
    expect(databases[0]?.close).toHaveBeenCalledOnce();
  });

  it('validates the CSV before opening the database', async () => {
    const openDatabase = vi.fn(() => createDatabase());

    await expect(
      runCli(
        ['import-movies', './data/movies.csv'],
        openDatabase,
        () => 'id,title',
        vi.fn(),
      ),
    ).rejects.toThrow(/exactly these columns/);

    expect(openDatabase).not.toHaveBeenCalled();
  });

  it('closes the database and propagates an import failure', async () => {
    const database = createDatabase();
    database.exec(`
      CREATE TRIGGER reject_movie BEFORE INSERT ON movies
      BEGIN
        SELECT RAISE(ABORT, 'rejected movie');
      END;
    `);
    const openDatabase = vi.fn(() => database);

    await expect(
      runCli(
        ['import-movies', './data/movies.csv'],
        openDatabase,
        () => CSV,
        vi.fn(),
      ),
    ).rejects.toThrow('rejected movie');

    expect(new MovieRepository(database).findAll()).toEqual([]);
    expect(databases[0]?.close).toHaveBeenCalledOnce();
  });
});

describe('backend-cli create-database', () => {
  it.each([
    [['create-database'], DEFAULT_DATABASE_PATH],
    [
      ['--path', './data/root-movies.sqlite', 'create-database'],
      resolve('./data/root-movies.sqlite'),
    ],
    [
      ['create-database', '--path', './data/command-movies.sqlite'],
      resolve('./data/command-movies.sqlite'),
    ],
  ])('opens the selected database and closes it', async (args, path) => {
    const database = createDatabase();
    const openDatabase = vi.fn(() => database);
    const logger = vi.fn();

    await runCli(args, openDatabase, vi.fn(), logger);

    expect(openDatabase).toHaveBeenCalledWith(path);
    expect(logger).toHaveBeenCalledWith(`Database available at ${path}`);
    expect(databases.at(-1)?.close).toHaveBeenCalledOnce();
  });
});
