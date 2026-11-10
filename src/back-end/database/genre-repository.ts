import type { DatabaseSync } from 'node:sqlite';
import type { Genre } from '../types/Genre.ts';

type GenreRow = {
  tmdb_id: number;
  name: string;
};

export class GenreRepository {
  private readonly database: DatabaseSync;

  public constructor(database: DatabaseSync) {
    this.database = database;
  }

  public findById(id: number): Genre | undefined {
    const row = this.database
      .prepare('SELECT tmdb_id, name FROM genre WHERE tmdb_id = ?')
      .get(id) as GenreRow | undefined;

    return row ? { id: row.tmdb_id, name: row.name } : undefined;
  }

  public findAll(): Genre[] {
    const rows = this.database
      .prepare('SELECT tmdb_id, name FROM genre ORDER BY tmdb_id ASC')
      .all() as unknown as GenreRow[];

    return rows.map((row) => ({ id: row.tmdb_id, name: row.name }));
  }

  public saveAll(genres: Iterable<Genre>): void {
    const statement = this.database.prepare(`
      INSERT INTO genre (tmdb_id, name)
      VALUES (?, ?)
      ON CONFLICT (tmdb_id) DO UPDATE SET name = excluded.name
    `);

    for (const genre of genres) {
      statement.run(genre.id, genre.name);
    }
  }

  public deleteUnused(): number {
    const result = this.database
      .prepare(`
      DELETE FROM genre
      WHERE NOT EXISTS (
        SELECT 1
        FROM film_genre
        WHERE film_genre.genre_tmdb_id = genre.tmdb_id
      )
    `)
      .run();

    return Number(result.changes);
  }
}
