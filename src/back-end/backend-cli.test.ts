import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCli,
  DEFAULT_DATABASE_PATH,
  type OpenDatabase,
} from './backend-cli.ts';
import { getDatabase } from './database/schema.ts';

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

describe('backend CLI catalog commands', () => {
  it('creates the selected database and closes the connection', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'nested', 'movies.sqlite');
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = getDatabase(path);
      return openedDatabase;
    };
    const logger = vi.fn();

    // Act
    createCli(openDatabase, logger).parse([
      'node',
      'backend-cli',
      'create-database',
      '--path',
      databasePath,
    ]);

    // Assert
    expect(openedDatabase?.isOpen).toBe(false);
    expect(logger).toHaveBeenCalledWith(
      `Database available at ${resolve(databasePath)}`,
    );
    const database = new DatabaseSync(databasePath);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE name = 'genres'")
        .get(),
    ).toBeTruthy();
    database.close();
  });

  it('creates the database and parent directory with the default opener', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'nested', 'default.sqlite');
    const logger = vi.fn();

    // Act
    createCli(undefined, logger).parse([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'clean-genres',
    ]);

    // Assert
    const database = new DatabaseSync(databasePath);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE name = 'genres'")
        .get(),
    ).toBeTruthy();
    database.close();
    expect(logger).toHaveBeenCalledWith(
      `Deleted 0 unused genres from ${resolve(databasePath)}`,
    );
  });

  it('imports genres into the selected database and reports the count and path', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'custom.sqlite');
    const csvPath = join(directory, 'genres.csv');
    writeFileSync(csvPath, 'id,name\n35,Comedy\n12,Adventure\n');
    const logger = vi.fn();
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = getDatabase(path);
      return openedDatabase;
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
    expect(openedDatabase?.isOpen).toBe(false);
    const database = new DatabaseSync(databasePath);
    expect(
      database.prepare('SELECT id, name FROM genres ORDER BY id').all(),
    ).toEqual([
      { id: 12, name: 'Adventure' },
      { id: 35, name: 'Comedy' },
    ]);
    database.close();
    expect(logger).toHaveBeenCalledWith(
      `Imported 2 genres into ${resolve(databasePath)}`,
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
    const seedDatabase = getDatabase(databasePath);
    seedDatabase.prepare("INSERT INTO genres VALUES (1, 'Original')").run();
    seedDatabase.exec(`
      CREATE TRIGGER reject_genre BEFORE INSERT ON genres
      WHEN NEW.id = 2
      BEGIN SELECT RAISE(ABORT, 'rejected genre'); END;
    `);
    seedDatabase.close();
    writeFileSync(csvPath, 'id,name\n1,Updated\n2,Rejected\n');
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = getDatabase(path);
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
      verificationDatabase.prepare('SELECT id, name FROM genres').all(),
    ).toEqual([{ id: 1, name: 'Original' }]);
    verificationDatabase.close();
  });

  it('reports both import and rollback failures', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'movies.sqlite');
    const csvPath = join(directory, 'genres.csv');
    const seedDatabase = getDatabase(databasePath);
    seedDatabase.exec(`
      CREATE TRIGGER reject_genre BEFORE INSERT ON genres
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

    // Act and assert: both failures are preserved and the connection closes.
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
    const seedDatabase = getDatabase(databasePath);
    seedDatabase
      .prepare(
        `INSERT INTO movies (
          id, title, original_title, original_language, overview, collected_at
        ) VALUES (1, 'Film', 'Film', 'fr', 'Résumé', 'now')`,
      )
      .run();
    seedDatabase.prepare("INSERT INTO genres VALUES (1, 'Used')").run();
    seedDatabase.prepare("INSERT INTO genres VALUES (2, 'Unused')").run();
    seedDatabase.prepare('INSERT INTO movie_genres VALUES (1, 1)').run();
    seedDatabase.close();
    const logger = vi.fn();
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = getDatabase(path);
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
      `Deleted 1 unused genres from ${resolve(databasePath)}`,
    );
    const verificationDatabase = new DatabaseSync(databasePath);
    expect(
      verificationDatabase.prepare('SELECT id, name FROM genres').all(),
    ).toEqual([{ id: 1, name: 'Used' }]);
    verificationDatabase.close();
  });

  it('uses the default database path when cleaning genres without --path', () => {
    // Arrange
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = () => {
      openedDatabase = getDatabase(':memory:');
      return openedDatabase;
    };
    const logger = vi.fn();

    // Act
    createCli(openDatabase, logger).parse([
      'node',
      'backend-cli',
      'clean-genres',
    ]);

    // Assert
    expect(openedDatabase?.isOpen).toBe(false);
    expect(logger).toHaveBeenCalledWith(
      `Deleted 0 unused genres from ${resolve(DEFAULT_DATABASE_PATH)}`,
    );
  });

  it('imports countries into the selected database and reports the count and path', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'custom.sqlite');
    const csvPath = join(directory, 'countries.csv');
    const seedDatabase = getDatabase(databasePath);
    seedDatabase
      .prepare("INSERT INTO countries VALUES ('FR', 'French Republic')")
      .run();
    seedDatabase.close();
    writeFileSync(csvPath, 'code,name\nFR,France\nCA,Canada\n');
    const logger = vi.fn();
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = getDatabase(path);
      return openedDatabase;
    };

    // Act
    createCli(openDatabase, logger).parse([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'add-countries',
      csvPath,
    ]);

    // Assert
    expect(openedDatabase?.isOpen).toBe(false);
    const database = new DatabaseSync(databasePath);
    expect(
      database.prepare('SELECT code, name FROM countries ORDER BY code').all(),
    ).toEqual([
      { code: 'CA', name: 'Canada' },
      { code: 'FR', name: 'France' },
    ]);
    database.close();
    expect(logger).toHaveBeenCalledWith(
      `Imported 2 countries into ${resolve(databasePath)}`,
    );
  });

  it('validates country CSV before opening SQLite', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const csvPath = join(directory, 'invalid-countries.csv');
    writeFileSync(csvPath, 'code,name\nfr,France\n');
    const openDatabase = vi.fn<OpenDatabase>(() => {
      throw new Error('Database must not be opened');
    });

    // Act and assert
    expect(() =>
      createCli(openDatabase).parse([
        'node',
        'backend-cli',
        'add-countries',
        csvPath,
      ]),
    ).toThrow(/two-letter uppercase/);
    expect(openDatabase).not.toHaveBeenCalled();
  });

  it('rolls back a failed country import and closes the database connection', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'movies.sqlite');
    const csvPath = join(directory, 'countries.csv');
    const seedDatabase = getDatabase(databasePath);
    seedDatabase
      .prepare("INSERT INTO countries VALUES ('FR', 'French Republic')")
      .run();
    seedDatabase.exec(`
      CREATE TRIGGER reject_country BEFORE INSERT ON countries
      WHEN NEW.code = 'GB'
      BEGIN SELECT RAISE(ABORT, 'rejected country'); END;
    `);
    seedDatabase.close();
    writeFileSync(csvPath, 'code,name\nFR,France\nGB,Rejected\n');
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = getDatabase(path);
      return openedDatabase;
    };

    // Act and assert: the second row fails and the first update is rolled back.
    expect(() =>
      createCli(openDatabase).parse([
        'node',
        'backend-cli',
        '--path',
        databasePath,
        'add-countries',
        csvPath,
      ]),
    ).toThrow(/rejected country/);
    expect(openedDatabase?.isOpen).toBe(false);

    const verificationDatabase = new DatabaseSync(databasePath);
    expect(
      verificationDatabase.prepare('SELECT code, name FROM countries').all(),
    ).toEqual([{ code: 'FR', name: 'French Republic' }]);
    verificationDatabase.close();
  });

  it('removes only countries not associated with a film', () => {
    // Arrange
    const directory = createTemporaryDirectory();
    const databasePath = join(directory, 'movies.sqlite');
    const seedDatabase = getDatabase(databasePath);
    seedDatabase
      .prepare(
        `INSERT INTO movies (
          id, title, original_title, original_language, overview, collected_at
        ) VALUES (1, 'Film', 'Film', 'fr', 'Résumé', 'now')`,
      )
      .run();
    seedDatabase.prepare("INSERT INTO countries VALUES ('FR', 'France')").run();
    seedDatabase
      .prepare("INSERT INTO countries VALUES ('BE', 'Belgium')")
      .run();
    seedDatabase
      .prepare('INSERT INTO production_countries VALUES (1, ?)')
      .run('FR');
    seedDatabase.close();
    const logger = vi.fn();
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = (path) => {
      openedDatabase = getDatabase(path);
      return openedDatabase;
    };

    // Act
    createCli(openDatabase, logger).parse([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'clean-countries',
    ]);

    // Assert
    expect(openedDatabase?.isOpen).toBe(false);
    expect(logger).toHaveBeenCalledWith(
      `Deleted 1 unused countries from ${resolve(databasePath)}`,
    );
    const verificationDatabase = new DatabaseSync(databasePath);
    expect(
      verificationDatabase.prepare('SELECT code, name FROM countries').all(),
    ).toEqual([{ code: 'FR', name: 'France' }]);
    verificationDatabase.close();
  });

  it('uses the default database path when cleaning countries without --path', () => {
    // Arrange
    let openedDatabase: DatabaseSync | undefined;
    const openDatabase: OpenDatabase = () => {
      openedDatabase = getDatabase(':memory:');
      return openedDatabase;
    };
    const logger = vi.fn();

    // Act
    createCli(openDatabase, logger).parse([
      'node',
      'backend-cli',
      'clean-countries',
    ]);

    // Assert
    expect(openedDatabase?.isOpen).toBe(false);
    expect(logger).toHaveBeenCalledWith(
      `Deleted 0 unused countries from ${resolve(DEFAULT_DATABASE_PATH)}`,
    );
  });
});
