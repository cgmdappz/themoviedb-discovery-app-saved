import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCli, DEFAULT_DATABASE_PATH } from './backend-cli';

const databases: DatabaseSync[] = [];

afterEach(() => {
  databases.splice(0);
  vi.restoreAllMocks();
});

describe('backend CLI', () => {
  it('initializes the default database path', () => {
    // Arrange
    const openDatabase = vi.fn(() => {
      const database = new DatabaseSync(':memory:');
      databases.push(database);
      return database;
    });

    // Act
    createCli(openDatabase).parse(['node', 'backend-cli']);

    // Assert
    expect(openDatabase).toHaveBeenCalledWith(
      expect.stringContaining(DEFAULT_DATABASE_PATH.replace('./', '')),
    );
  });

  it('initializes the database at the path provided with --path', () => {
    // Arrange
    const openDatabase = vi.fn(() => {
      const database = new DatabaseSync(':memory:');
      databases.push(database);
      return database;
    });

    // Act
    createCli(openDatabase).parse([
      'node',
      'backend-cli',
      '--path',
      './data/custom-movies.sqlite',
    ]);

    // Assert
    expect(openDatabase).toHaveBeenCalledWith(
      expect.stringContaining('data/custom-movies.sqlite'),
    );
  });

  it('creates a SQLite file when using the default database opener', () => {
    // Arrange
    const directory = mkdtempSync(`${tmpdir()}/tmdb-cli-`);
    const path = `${directory}/nested/movies.sqlite`;

    // Act
    createCli().parse(['node', 'backend-cli', '--path', path]);

    // Assert
    const database = new DatabaseSync(path);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE name = 'film'")
        .get(),
    ).toBeTruthy();
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
