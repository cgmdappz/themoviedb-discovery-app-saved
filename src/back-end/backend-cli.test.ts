import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCli,
  DEFAULT_DATABASE_PATH,
  type OpenDatabase,
} from './backend-cli.ts';
import { initializeDatabase } from './database/schema.ts';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
  vi.restoreAllMocks();
});

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'tmdb-cli-'));
  temporaryDirectories.push(directory);
  return directory;
}

function createDatabase(path: string): DatabaseSync {
  const database = new DatabaseSync(path);
  initializeDatabase(database);
  return database;
}

describe('backend CLI genre commands', () => {
  it('initializes the database at the default path without a command', () => {
    // Arrange
    const database = new DatabaseSync(':memory:');
    const close = vi.spyOn(database, 'close');
    const openDatabase = vi.fn<OpenDatabase>(() => database);
    const logger = vi.fn();

    // Act
    createCli(openDatabase, logger).parse(['node', 'backend-cli']);

    // Assert
    expect(openDatabase).toHaveBeenCalledWith(
      expect.stringContaining(DEFAULT_DATABASE_PATH.replace('./', '')),
    );
    expect(close).toHaveBeenCalledOnce();
    expect(logger).toHaveBeenCalledWith(
      expect.stringContaining('Database initialized at'),
    );
  });

  it('creates the selected database file and parent directory by default', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'nested', 'movies.sqlite');

    // Act
    createCli().parse(['node', 'backend-cli', '--path', databasePath]);

    // Assert
    const database = new DatabaseSync(databasePath);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE name = 'film'")
        .get(),
    ).toBeTruthy();
    database.close();
  });

  it('imports genres into the selected database and reports the count and path', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'custom.sqlite');
    const csvPath = join(directory, 'genres.csv');
    writeFileSync(csvPath, 'id,name\n35,Comedy\n12,Adventure\n');
    const logger = vi.fn();
    let importedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      importedDatabase = new DatabaseSync(path);
      return importedDatabase;
    };

    // Act
    createCli(openDatabase, logger).parse([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'add-genres',
      csvPath,
    ]);

    // Assert
    expect(importedDatabase?.isOpen).toBe(false);
    const database = new DatabaseSync(databasePath);
    expect(
      database
        .prepare('SELECT tmdb_id, name FROM genre ORDER BY tmdb_id')
        .all(),
    ).toEqual([
      { tmdb_id: 12, name: 'Adventure' },
      { tmdb_id: 35, name: 'Comedy' },
    ]);
    database.close();
    expect(logger).toHaveBeenCalledWith(
      `Imported 2 genres into ${databasePath}`,
    );
  });

  it('validates the CSV before opening SQLite', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const csvPath = join(directory, 'invalid.csv');
    writeFileSync(csvPath, 'id,name\nnot-an-id,Drama\n');
    const openDatabase = vi.fn<OpenDatabase>(() => {
      throw new Error('Database must not be opened');
    });

    // Act and assert
    expect(() =>
      createCli(openDatabase).parse([
        'node',
        'backend-cli',
        'add-genres',
        csvPath,
      ]),
    ).toThrow(/positive integer id/);
    expect(openDatabase).not.toHaveBeenCalled();
  });

  it('rolls back a failed import and closes the database connection', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'movies.sqlite');
    const csvPath = join(directory, 'genres.csv');
    const seedDatabase = createDatabase(databasePath);
    seedDatabase.prepare("INSERT INTO genre VALUES (1, 'Original')").run();
    seedDatabase.exec(`
      CREATE TRIGGER reject_genre BEFORE INSERT ON genre
      WHEN NEW.tmdb_id = 2
      BEGIN SELECT RAISE(ABORT, 'rejected genre'); END;
    `);
    seedDatabase.close();
    writeFileSync(csvPath, 'id,name\n1,Updated\n2,Rejected\n');
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = new DatabaseSync(path);
      return openedDatabase;
    };

    // Act and assert: the second row fails and the first update is rolled back.
    expect(() =>
      createCli(openDatabase).parse([
        'node',
        'backend-cli',
        '--path',
        databasePath,
        'add-genres',
        csvPath,
      ]),
    ).toThrow(/rejected genre/);
    expect(openedDatabase?.isOpen).toBe(false);

    const verificationDatabase = new DatabaseSync(databasePath);
    expect(
      verificationDatabase.prepare('SELECT tmdb_id, name FROM genre').all(),
    ).toEqual([{ tmdb_id: 1, name: 'Original' }]);
    verificationDatabase.close();
  });

  it('reports both import and rollback failures', () => {
    // Arrange: make the genre insert and subsequent rollback fail.
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'movies.sqlite');
    const csvPath = join(directory, 'genres.csv');
    const seedDatabase = createDatabase(databasePath);
    seedDatabase.exec(`
      CREATE TRIGGER reject_genre BEFORE INSERT ON genre
      BEGIN SELECT RAISE(ABORT, 'rejected genre'); END;
    `);
    seedDatabase.close();
    writeFileSync(csvPath, 'id,name\n1,Rejected\n');
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = new DatabaseSync(path);
      const originalExec = openedDatabase.exec.bind(openedDatabase);
      vi.spyOn(openedDatabase, 'exec').mockImplementation((sql) => {
        if (sql === 'ROLLBACK') throw new Error('rollback denied');
        return originalExec(sql);
      });
      return openedDatabase;
    };

    // Act and assert: both errors remain visible, and the handle is closed.
    expect(() =>
      createCli(openDatabase).parse([
        'node',
        'backend-cli',
        '--path',
        databasePath,
        'add-genres',
        csvPath,
      ]),
    ).toThrow(AggregateError);
    expect(openedDatabase?.isOpen).toBe(false);
  });

  it('removes only genres not associated with a film', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'movies.sqlite');
    const database = createDatabase(databasePath);
    database
      .prepare(
        `INSERT INTO film (
          tmdb_id, title, original_title, observed_at
        ) VALUES (1, 'Film', 'Film', 'now')`,
      )
      .run();
    database.prepare("INSERT INTO genre VALUES (1, 'Used')").run();
    database.prepare("INSERT INTO genre VALUES (2, 'Unused')").run();
    database.prepare('INSERT INTO film_genre VALUES (1, 1)').run();
    database.close();
    const logger = vi.fn();
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = new DatabaseSync(path);
      return openedDatabase;
    };

    // Act
    createCli(openDatabase, logger).parse([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'clean-genres',
    ]);

    // Assert
    expect(openedDatabase?.isOpen).toBe(false);
    expect(logger).toHaveBeenCalledWith(
      `Deleted 1 unused genres from ${databasePath}`,
    );
    const verificationDatabase = new DatabaseSync(databasePath);
    expect(
      verificationDatabase.prepare('SELECT tmdb_id, name FROM genre').all(),
    ).toEqual([{ tmdb_id: 1, name: 'Used' }]);
    verificationDatabase.close();
  });

  it('cleans the default database path when --path is omitted', () => {
    // Arrange
    const database = new DatabaseSync(':memory:');
    initializeDatabase(database);
    const close = vi.spyOn(database, 'close');
    const openDatabase = vi.fn<OpenDatabase>(() => database);
    const logger = vi.fn();

    // Act
    createCli(openDatabase, logger).parse([
      'node',
      'backend-cli',
      'clean-genres',
    ]);

    // Assert
    expect(openDatabase).toHaveBeenCalledWith(
      expect.stringContaining(DEFAULT_DATABASE_PATH.replace('./', '')),
    );
    expect(close).toHaveBeenCalledOnce();
    expect(logger).toHaveBeenCalledWith(
      expect.stringContaining('Deleted 0 unused genres from'),
    );
  });
});
