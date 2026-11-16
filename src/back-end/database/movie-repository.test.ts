import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import type { MovieRecordInput } from '../types/MovieRecord.ts';
import { initializeSchema } from './schema.ts';
import { MovieRepository } from './movie-repository.ts';

const databases: DatabaseSync[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function createRepository(): MovieRepository {
  const database = new DatabaseSync(':memory:');
  databases.push(database);
  initializeSchema(database);
  return new MovieRepository(database);
}

const movie: MovieRecordInput = {
  id: 20,
  title: 'The Example',
  original_title: 'L’Exemple',
  original_language: 'fr',
  overview: 'A sample movie.',
  release_date: '2020-05-10',
  popularity: 12.5,
  vote_average: 8,
  vote_count: 100,
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  runtime_minutes: 120,
  budget: 1000000,
  revenue: 2500000,
  collected_at: '2026-11-16T17:00:00.000Z',
};

describe('MovieRepository', () => {
  it('finds an existing movie and returns undefined for an unknown id', () => {
    // Arrange
    const repository = createRepository();
    repository.saveAll([movie]);

    // Act and assert
    expect(repository.findById(movie.id)).toEqual({
      ...movie,
      release_year: 2020,
    });
    expect(repository.findById(999)).toBeUndefined();
  });

  it('returns an empty list and then lists movies in ascending id order', () => {
    // Arrange
    const repository = createRepository();
    const olderMovie = { ...movie, id: 10, release_date: '2010-01-01' };

    // Act and assert
    expect(repository.findAll()).toEqual([]);
    repository.saveAll([movie, olderMovie]);
    expect(repository.findAll().map(({ id }) => id)).toEqual([10, 20]);
  });

  it('inserts and updates movies without creating duplicate ids', () => {
    // Arrange
    const repository = createRepository();
    repository.saveAll([movie]);

    // Act
    const updatedMovie = {
      ...movie,
      title: 'The Updated Example',
      release_date: '2024-06-15',
      runtime_minutes: null,
      budget: null,
      revenue: null,
      collected_at: '2026-11-16T17:05:00.000Z',
    };
    repository.saveAll([updatedMovie]);

    // Assert
    expect(repository.findById(movie.id)).toEqual({
      ...updatedMovie,
      release_year: 2024,
    });
    expect(repository.findAll()).toHaveLength(1);
  });

  it('leaves the database unchanged when given an empty iterable', () => {
    // Arrange
    const repository = createRepository();
    repository.saveAll([movie]);

    // Act
    repository.saveAll([]);

    // Assert
    expect(repository.findAll()).toEqual([
      {
        ...movie,
        release_year: 2020,
      },
    ]);
  });
});
