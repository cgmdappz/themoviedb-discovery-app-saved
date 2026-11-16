import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import type { Genre } from '../types/Genre.ts';
import { initializeSchema } from './schema.ts';
import { GenreRepository } from './genre-repository.ts';

const databases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function createRepository(): GenreRepository {
  const database = new DatabaseSync(':memory:');
  databases.push(database);
  initializeSchema(database);
  return new GenreRepository(database);
}

describe('GenreRepository', () => {
  it('finds an existing genre and returns undefined for an unknown id', () => {
    // Arrange
    const repository = createRepository();
    repository.saveAll([{ id: 35, name: 'Comédie' }]);

    // Act and assert
    expect(repository.findById(35)).toEqual({ id: 35, name: 'Comédie' });
    expect(repository.findById(99)).toBeUndefined();
  });

  it('lists genres in ascending identifier order', () => {
    // Arrange
    const repository = createRepository();
    repository.saveAll([
      { id: 18, name: 'Drame' },
      { id: 28, name: 'Action' },
      { id: 12, name: 'Aventure' },
    ]);

    // Act and assert
    expect(repository.findAll()).toEqual([
      { id: 12, name: 'Aventure' },
      { id: 18, name: 'Drame' },
      { id: 28, name: 'Action' },
    ]);
  });

  it('inserts and updates genres without creating duplicates', () => {
    // Arrange
    const repository = createRepository();
    repository.saveAll([{ id: 35, name: 'Comedy' }]);

    // Act
    repository.saveAll([
      { id: 35, name: 'Comédie' },
      { id: 12, name: 'Aventure' },
    ]);

    // Assert
    expect(repository.findAll()).toEqual([
      { id: 12, name: 'Aventure' },
      { id: 35, name: 'Comédie' },
    ]);
  });

  it('accepts iterables, leaves empty input unchanged, and keeps the last duplicate', () => {
    // Arrange
    const repository = createRepository();
    const genres = new Set<Genre>([
      { id: 28, name: 'Action' },
      { id: 28, name: 'Action finale' },
    ]);

    // Act
    repository.saveAll(genres);
    repository.saveAll([]);

    // Assert
    expect(repository.findById(28)).toEqual({
      id: 28,
      name: 'Action finale',
    });
    expect(repository.findAll()).toHaveLength(1);
  });
});
