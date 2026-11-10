import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import type { Country } from '../types/Country.ts';
import { initializeDatabase } from './schema.ts';
import { CountryRepository } from './country-repository.ts';

const databases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function createRepository(): CountryRepository {
  const database = new DatabaseSync(':memory:');
  databases.push(database);
  initializeDatabase(database);
  return new CountryRepository(database);
}

describe('CountryRepository', () => {
  it('finds an existing country and returns undefined for an unknown code', () => {
    // Arrange
    const repository = createRepository();
    repository.saveAll([{ code: 'FR', name: 'France' }]);

    // Act and assert
    expect(repository.findByCode('FR')).toEqual({
      code: 'FR',
      name: 'France',
    });
    expect(repository.findByCode('ZZ')).toBeUndefined();
  });

  it('returns an empty list and then lists countries in code order', () => {
    // Arrange
    const repository = createRepository();

    // Act and assert
    expect(repository.findAll()).toEqual([]);
    repository.saveAll([
      { code: 'US', name: 'United States' },
      { code: 'BE', name: 'Belgium' },
      { code: 'FR', name: 'France' },
    ]);
    expect(repository.findAll()).toEqual([
      { code: 'BE', name: 'Belgium' },
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
  });

  it('inserts and updates countries without creating duplicates', () => {
    // Arrange
    const repository = createRepository();
    repository.saveAll([{ code: 'FR', name: 'French Republic' }]);

    // Act
    repository.saveAll([
      { code: 'FR', name: 'France' },
      { code: 'BE', name: 'Belgium' },
    ]);

    // Assert
    expect(repository.findAll()).toEqual([
      { code: 'BE', name: 'Belgium' },
      { code: 'FR', name: 'France' },
    ]);
  });

  it('accepts iterables, leaves data unchanged for empty input, and keeps the last repeated code', () => {
    // Arrange
    const repository = createRepository();
    const entries = [
      { code: 'CA', name: 'Canada' },
      { code: 'CA', name: 'Canada (updated)' },
    ];

    // Act
    repository.saveAll(entries);
    repository.saveAll(new Set<Country>());

    // Assert
    expect(repository.findByCode('CA')).toEqual({
      code: 'CA',
      name: 'Canada (updated)',
    });
    expect(repository.findAll()).toHaveLength(1);
  });
});
