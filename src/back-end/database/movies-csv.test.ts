import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import type { MovieRecordInput } from '../types/MovieRecord.ts';
import { MovieRepository } from './movie-repository.ts';
import { importMovies, parseMoviesCsv } from './movies-csv.ts';
import { initializeSchema } from './schema.ts';

const HEADER =
  'id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime_minutes,budget,revenue,collected_at';

const CSV_FIELDS = [
  '12',
  '"Example, Part One"',
  '"Original Example"',
  'en',
  '"An ""example"" movie."',
  '2024-02-29',
  '3.5',
  '0',
  '0',
  '/poster.jpg',
  '',
  '0',
  '0',
  '250',
  '2026-11-17T10:00:00.000Z',
];
const CSV_MOVIE = CSV_FIELDS.join(',');

function csvWith(column: string, value: string): string {
  const fields = [...CSV_FIELDS];
  fields[HEADER.split(',').indexOf(column)] = value;
  return `${HEADER}\n${fields.join(',')}`;
}

const movie: MovieRecordInput = {
  id: 12,
  title: 'Example',
  original_title: 'Original Example',
  original_language: 'en',
  overview: 'An example movie.',
  release_date: '2024-02-29',
  popularity: 3.5,
  vote_average: 8,
  vote_count: 20,
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  runtime_minutes: 120,
  budget: 1000,
  revenue: 2000,
  collected_at: '2026-11-17T10:00:00.000Z',
};

const databases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  initializeSchema(database);
  databases.push(database);
  return database;
}

describe('parseMoviesCsv', () => {
  it('accepts BOM, CRLF, reordered headers, quoted commas and escaped quotes', () => {
    const reorderedHeader = HEADER.split(',').reverse().join(',');
    const reorderedRow = [...CSV_FIELDS].reverse().join(',');
    const rows = parseMoviesCsv(
      `\uFEFF${reorderedHeader.toUpperCase()}\r\n${reorderedRow}\r\n\r\n`,
    );

    expect(rows).toEqual([
      {
        id: 12,
        title: 'Example, Part One',
        original_title: 'Original Example',
        original_language: 'en',
        overview: 'An "example" movie.',
        release_date: '2024-02-29',
        popularity: 3.5,
        vote_average: 0,
        vote_count: 0,
        poster_path: '/poster.jpg',
        backdrop_path: null,
        runtime_minutes: null,
        budget: null,
        revenue: 250,
        collected_at: '2026-11-17T10:00:00.000Z',
      },
    ]);
  });

  it('maps blank optional values to null and accepts a header-only document', () => {
    const emptyMovie = [
      13,
      'A Film',
      'Original Film',
      'fr',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '2026-11-17T10:00:00.000Z',
    ].join(',');

    expect(parseMoviesCsv(`${HEADER}\n${emptyMovie}`)).toEqual([
      {
        ...movie,
        id: 13,
        title: 'A Film',
        original_title: 'Original Film',
        original_language: 'fr',
        overview: '',
        release_date: null,
        popularity: null,
        vote_average: null,
        vote_count: null,
        poster_path: null,
        backdrop_path: null,
        runtime_minutes: null,
        budget: null,
        revenue: null,
      },
    ]);
    expect(parseMoviesCsv(HEADER)).toEqual([]);
  });

  it.each([
    ['', /exactly these columns/],
    [`${HEADER},extra`, /exactly these columns/],
    [HEADER.replace('title,', 'id,'), /exactly these columns/],
    [`${HEADER}\n${CSV_MOVIE},extra`, /unexpected number of columns/],
    [
      `${HEADER}\n${CSV_FIELDS.slice(0, -1).join(',')}`,
      /unexpected number of columns/,
    ],
    [`${HEADER}\n${CSV_MOVIE.replace('12,', 'x,')}`, /positive integer id/],
    [`${HEADER}\n${CSV_MOVIE.replace('12,', '0,')}`, /positive integer id/],
    [
      `${HEADER}\n${CSV_MOVIE.replace('12,', '9007199254740992,')}`,
      /positive integer id/,
    ],
    [csvWith('title', ''), /empty title/],
    [
      `${HEADER}\n${CSV_MOVIE.replace('2024-02-29', '2024/02/29')}`,
      /invalid release_date/,
    ],
    [csvWith('popularity', 'NaN'), /invalid number in popularity/],
    [csvWith('vote_count', '-1'), /invalid non-negative integer in vote_count/],
    [
      csvWith('runtime_minutes', '-1'),
      /invalid non-negative integer in runtime_minutes/,
    ],
    [csvWith('collected_at', ''), /empty collected_at/],
    [
      `${HEADER}\n${CSV_MOVIE.replace('"An ""example"" movie."', '"unfinished')}`,
      /malformed CSV/,
    ],
  ])('rejects invalid CSV input %s', (contents, expectedError) => {
    expect(() => parseMoviesCsv(contents)).toThrow(expectedError);
  });
});

describe('importMovies', () => {
  it('inserts and updates movies from CSV without duplicating ids', () => {
    const database = createDatabase();
    const repository = new MovieRepository(database);

    expect(
      importMovies(database, parseMoviesCsv(`${HEADER}\n${CSV_MOVIE}`)),
    ).toBe(1);
    expect(
      importMovies(
        database,
        parseMoviesCsv(csvWith('title', 'Updated Example')),
      ),
    ).toBe(1);

    expect(repository.findById(movie.id)?.title).toBe('Updated Example');
    expect(repository.findAll()).toHaveLength(1);
  });

  it('leaves the database unchanged when importing an empty iterable', () => {
    const database = createDatabase();

    expect(importMovies(database, [])).toBe(0);
    expect(new MovieRepository(database).findAll()).toEqual([]);
  });

  it('rolls back the full import when a database write fails', () => {
    const database = createDatabase();
    database.exec(`
      CREATE TRIGGER reject_movie BEFORE INSERT ON movies
      BEGIN
        SELECT RAISE(ABORT, 'rejected movie');
      END;
    `);

    expect(() => importMovies(database, [movie])).toThrow('rejected movie');
    expect(new MovieRepository(database).findAll()).toEqual([]);
  });
});
