import type { DatabaseSync } from 'node:sqlite';
import type { Genre } from '../types/Genre.ts';

type GenreRow = {
  id: number;
  name: string;
};

export class GenreRepository {
  private readonly database: DatabaseSync;

  public constructor(database: DatabaseSync) {
    this.database = database;
  }

  public findById(id: number): Genre | undefined {
    const row = this.database
      .prepare('SELECT id, name FROM genres WHERE id = ?')
      .get(id) as GenreRow | undefined;

    return row ? { id: row.id, name: row.name } : undefined;
  }

  public findAll(): Genre[] {
    const rows = this.database
      .prepare('SELECT id, name FROM genres ORDER BY id ASC')
      .all() as unknown as GenreRow[];

    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  public saveAll(genres: Iterable<Genre>): void {
    const statement = this.database.prepare(`
      INSERT INTO genres (id, name)
      VALUES (?, ?)
      ON CONFLICT (id) DO UPDATE SET name = excluded.name
    `);

    for (const genre of genres) {
      statement.run(genre.id, genre.name);
    }
  }

  public deleteUnused(): number {
    const result = this.database
      .prepare(`
        DELETE FROM genres
        WHERE NOT EXISTS (
          SELECT 1
          FROM movie_genres
          WHERE movie_genres.genre_id = genres.id
        )
      `)
      .run();

    return Number(result.changes);
  }
}
