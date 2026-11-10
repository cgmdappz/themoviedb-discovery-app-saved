import type { DatabaseSync } from 'node:sqlite';
import type { Country } from '../types/Country.ts';

type CountryRow = {
  iso_3166_1: string;
  name: string;
};

export class CountryRepository {
  private readonly database: DatabaseSync;

  public constructor(database: DatabaseSync) {
    this.database = database;
  }

  public findByCode(code: string): Country | undefined {
    const row = this.database
      .prepare('SELECT iso_3166_1, name FROM country WHERE iso_3166_1 = ?')
      .get(code) as CountryRow | undefined;

    return row ? { code: row.iso_3166_1, name: row.name } : undefined;
  }

  public findAll(): Country[] {
    const rows = this.database
      .prepare('SELECT iso_3166_1, name FROM country ORDER BY iso_3166_1 ASC')
      .all() as unknown as CountryRow[];

    return rows.map((row) => ({ code: row.iso_3166_1, name: row.name }));
  }

  public saveAll(countries: Iterable<Country>): void {
    const statement = this.database.prepare(`
      INSERT INTO country (iso_3166_1, name)
      VALUES (?, ?)
      ON CONFLICT (iso_3166_1) DO UPDATE SET name = excluded.name
    `);

    for (const country of countries) {
      statement.run(country.code, country.name);
    }
  }
}
