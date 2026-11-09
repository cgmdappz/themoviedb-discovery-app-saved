import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeDatabase } from './schema';

const databases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function createDatabase() {
  const database = new DatabaseSync(':memory:');
  databases.push(database);
  initializeDatabase(database);
  return database;
}

describe('SQLite schema', () => {
  it('creates the model and calculates the stored release year', () => {
    // Arrange: initialize an in-memory database.
    const database = createDatabase();

    // Act: insert one film and its related catalog entries.
    database
      .prepare(
        `INSERT INTO film (
          tmdb_id, title, original_title, release_date, observed_at
        ) VALUES (1, 'Film', 'Original film', '2024-05-10', '2026-11-09')`,
      )
      .run();
    database
      .prepare('INSERT INTO genre (tmdb_id, name) VALUES (35, ?)')
      .run('Comédie');
    database
      .prepare('INSERT INTO country (iso_3166_1, name) VALUES (?, ?)')
      .run('FR', 'France');
    database.prepare('INSERT INTO film_genre VALUES (?, ?)').run(1, 35);
    database.prepare('INSERT INTO film_country VALUES (?, ?)').run(1, 'FR');

    // Assert: all tables exist and the year is stored from the date.
    expect(database.prepare('SELECT release_year FROM film').get()).toEqual({
      release_year: 2024,
    });
    expect(
      database.prepare('SELECT COUNT(*) AS count FROM film_genre').get(),
    ).toEqual({
      count: 1,
    });
  });

  it('rejects duplicate associations, invalid references, and non-positive measures', () => {
    // Arrange
    const database = createDatabase();
    database
      .prepare(
        "INSERT INTO film (tmdb_id, title, original_title, observed_at) VALUES (1, 'Film', 'Film', 'now')",
      )
      .run();
    database.prepare("INSERT INTO genre VALUES (35, 'Comédie')").run();
    database.prepare("INSERT INTO country VALUES ('FR', 'France')").run();

    // Act and assert: constraints protect uniqueness, references, and measures.
    database.prepare('INSERT INTO film_genre VALUES (1, 35)').run();
    expect(() =>
      database.prepare('INSERT INTO film_genre VALUES (1, 35)').run(),
    ).toThrow();
    expect(() =>
      database.prepare('INSERT INTO film_genre VALUES (1, 99)').run(),
    ).toThrow();
    expect(() =>
      database.prepare('UPDATE film SET budget = 0 WHERE tmdb_id = 1').run(),
    ).toThrow();
    expect(() =>
      database
        .prepare('UPDATE film SET runtime_minutes = -1 WHERE tmdb_id = 1')
        .run(),
    ).toThrow();
  });

  it('rolls back initialization failures and propagates the original error', () => {
    // Arrange: make initialization fail on the existing film table.
    const database = new DatabaseSync(':memory:');
    databases.push(database);
    database.exec('CREATE TABLE film (tmdb_id INTEGER PRIMARY KEY)');

    // Act and assert
    expect(() => initializeDatabase(database)).toThrow();
    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'genre'",
        )
        .get(),
    ).toBeUndefined();
  });
});
