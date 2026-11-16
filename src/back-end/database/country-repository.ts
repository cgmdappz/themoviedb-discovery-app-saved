import type { DatabaseSync } from 'node:sqlite';
import type { Country } from '../types/Country.ts';

type CountryRow = {
  code: string;
  name: string;
};

export class CountryRepository {
  private readonly database: DatabaseSync;

  public constructor(database: DatabaseSync) {
    this.database = database;
  }

  public findByCode(code: string): Country | undefined {
    const row = this.database
      .prepare('SELECT code, name FROM countries WHERE code = ?')
      .get(code) as CountryRow | undefined;

    return row ? { code: row.code, name: row.name } : undefined;
  }

  public findAll(): Country[] {
    const rows = this.database
      .prepare('SELECT code, name FROM countries ORDER BY code ASC')
      .all() as unknown as CountryRow[];

    return rows.map((row) => ({ code: row.code, name: row.name }));
  }

  public saveAll(countries: Iterable<Country>): void {
    const statement = this.database.prepare(`
      INSERT INTO countries (code, name)
      VALUES (?, ?)
      ON CONFLICT (code) DO UPDATE SET name = excluded.name
    `);

    for (const country of countries) {
      statement.run(country.code, country.name);
    }
  }
}
