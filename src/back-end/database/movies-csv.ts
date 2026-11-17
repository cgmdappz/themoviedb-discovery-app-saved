import { parse } from 'csv-parse/sync';
import type { DatabaseSync } from 'node:sqlite';
import type { MovieRecordInput } from '../types/MovieRecord.ts';
import { MovieRepository } from './movie-repository.ts';

const MOVIE_COLUMNS = [
  'id',
  'title',
  'original_title',
  'original_language',
  'overview',
  'release_date',
  'popularity',
  'vote_average',
  'vote_count',
  'poster_path',
  'backdrop_path',
  'runtime_minutes',
  'budget',
  'revenue',
  'collected_at',
] as const;

type MovieColumn = (typeof MOVIE_COLUMNS)[number];

export function parseMoviesCsv(contents: string): MovieRecordInput[] {
  let records: string[][];
  try {
    records = parse(contents, {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as string[][];
  } catch (error) {
    throw new Error('Invalid movies CSV: malformed CSV syntax.', {
      cause: error,
    });
  }

  const [header, ...rows] = records;
  const normalizedHeader = header?.map((column) => column.toLowerCase());
  if (
    !normalizedHeader ||
    normalizedHeader.length !== MOVIE_COLUMNS.length ||
    new Set(normalizedHeader).size !== MOVIE_COLUMNS.length ||
    !MOVIE_COLUMNS.every((column) => normalizedHeader.includes(column))
  ) {
    throw new Error(
      `Invalid movies CSV: expected exactly these columns: ${MOVIE_COLUMNS.join(', ')}.`,
    );
  }

  const indexes = new Map(
    normalizedHeader.map((column, index) => [column, index]),
  );
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    if (row.length !== MOVIE_COLUMNS.length) {
      throw new Error(
        `Invalid movies CSV: row ${rowNumber} has an unexpected number of columns.`,
      );
    }

    const value = (column: MovieColumn) => row[indexes.get(column)!]!.trim();
    const id = parsePositiveInteger(value('id'), 'id', rowNumber);
    const title = parseRequiredText(value('title'), 'title', rowNumber);
    const originalTitle = parseRequiredText(
      value('original_title'),
      'original_title',
      rowNumber,
    );
    const originalLanguage = parseRequiredText(
      value('original_language'),
      'original_language',
      rowNumber,
    );
    const overview = value('overview');
    const rawReleaseDate = value('release_date');
    const releaseDate = rawReleaseDate || null;
    if (releaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
      throw new Error(
        `Invalid movies CSV: row ${rowNumber} has an invalid release_date.`,
      );
    }

    const popularity = parseNullableNumber(
      value('popularity'),
      'popularity',
      rowNumber,
    );
    const voteAverage = parseNullableNumber(
      value('vote_average'),
      'vote_average',
      rowNumber,
    );
    const voteCount = parseNullableInteger(
      value('vote_count'),
      'vote_count',
      rowNumber,
      false,
    );
    const runtimeMinutes = parseNullableInteger(
      value('runtime_minutes'),
      'runtime_minutes',
      rowNumber,
      true,
    );
    const budget = parseNullableInteger(
      value('budget'),
      'budget',
      rowNumber,
      true,
    );
    const revenue = parseNullableInteger(
      value('revenue'),
      'revenue',
      rowNumber,
      true,
    );
    const collectedAt = parseRequiredText(
      value('collected_at'),
      'collected_at',
      rowNumber,
    );

    return {
      id,
      title,
      original_title: originalTitle,
      original_language: originalLanguage,
      overview,
      release_date: releaseDate,
      popularity,
      vote_average: voteAverage,
      vote_count: voteCount,
      poster_path: value('poster_path') || null,
      backdrop_path: value('backdrop_path') || null,
      runtime_minutes: runtimeMinutes,
      budget,
      revenue,
      collected_at: collectedAt,
    };
  });
}

export function importMovies(
  database: DatabaseSync,
  movies: Iterable<MovieRecordInput>,
): number {
  const records = [...movies];
  if (records.length === 0) return 0;

  database.exec('BEGIN IMMEDIATE');
  try {
    new MovieRepository(database).saveAll(records);
    database.exec('COMMIT');
    return records.length;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function parseRequiredText(
  value: string,
  column: MovieColumn,
  rowNumber: number,
): string {
  if (!value) {
    throw new Error(
      `Invalid movies CSV: row ${rowNumber} has an empty ${column}.`,
    );
  }
  return value;
}

function parsePositiveInteger(
  value: string,
  column: MovieColumn,
  rowNumber: number,
): number {
  if (!/^[0-9]+$/.test(value)) {
    throw new Error(
      `Invalid movies CSV: row ${rowNumber} has an invalid positive integer ${column}.`,
    );
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid movies CSV: row ${rowNumber} has an invalid positive integer ${column}.`,
    );
  }
  return parsed;
}

function parseNullableNumber(
  value: string,
  column: MovieColumn,
  rowNumber: number,
): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Invalid movies CSV: row ${rowNumber} has an invalid number in ${column}.`,
    );
  }
  return parsed;
}

function parseNullableInteger(
  value: string,
  column: MovieColumn,
  rowNumber: number,
  zeroIsUnknown: boolean,
): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(
      `Invalid movies CSV: row ${rowNumber} has an invalid non-negative integer in ${column}.`,
    );
  }
  return zeroIsUnknown && parsed === 0 ? null : parsed;
}
