import type { DatabaseSync } from 'node:sqlite';
import type { MovieRecord, MovieRecordInput } from '../types/MovieRecord.ts';

export class MovieRepository {
  private readonly database: DatabaseSync;

  public constructor(database: DatabaseSync) {
    this.database = database;
  }

  public findById(id: number): MovieRecord | undefined {
    const row = this.database
      .prepare(`
        SELECT
          id, title, original_title, original_language, overview,
          release_date, release_year, popularity, vote_average, vote_count,
          poster_path, backdrop_path, runtime_minutes, budget, revenue,
          collected_at
        FROM movies
        WHERE id = ?
      `)
      .get(id) as MovieRecord | undefined;

    return row;
  }

  public findAll(): MovieRecord[] {
    return this.database
      .prepare(`
        SELECT
          id, title, original_title, original_language, overview,
          release_date, release_year, popularity, vote_average, vote_count,
          poster_path, backdrop_path, runtime_minutes, budget, revenue,
          collected_at
        FROM movies
        ORDER BY id ASC
      `)
      .all() as unknown as MovieRecord[];
  }

  public saveAll(movies: Iterable<MovieRecordInput>): void {
    const statement = this.database.prepare(`
      INSERT INTO movies (
        id, title, original_title, original_language, overview, release_date,
        popularity, vote_average, vote_count, poster_path, backdrop_path,
        runtime_minutes, budget, revenue, collected_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        title = excluded.title,
        original_title = excluded.original_title,
        original_language = excluded.original_language,
        overview = excluded.overview,
        release_date = excluded.release_date,
        popularity = excluded.popularity,
        vote_average = excluded.vote_average,
        vote_count = excluded.vote_count,
        poster_path = excluded.poster_path,
        backdrop_path = excluded.backdrop_path,
        runtime_minutes = excluded.runtime_minutes,
        budget = excluded.budget,
        revenue = excluded.revenue,
        collected_at = excluded.collected_at
    `);

    for (const movie of movies) {
      statement.run(
        movie.id,
        movie.title,
        movie.original_title,
        movie.original_language,
        movie.overview,
        movie.release_date,
        movie.popularity,
        movie.vote_average,
        movie.vote_count,
        movie.poster_path,
        movie.backdrop_path,
        movie.runtime_minutes,
        movie.budget,
        movie.revenue,
        movie.collected_at,
      );
    }
  }
}
