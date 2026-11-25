// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import type { Movie } from '../../../back-end/types/MoviesTypes';
import MovieItem from './MovieItem';

afterEach(cleanup);

const movie: Movie = {
  backdrop_path: null,
  genre_ids: [],
  id: 123,
  original_language: 'en',
  original_title: 'Example Movie',
  overview: 'An example film.',
  popularity: 12,
  title: 'Example Movie',
  release_date: '2024-05-10',
  vote_average: 7.456,
  vote_count: 100,
  poster_path: '/example-poster.jpg',
};

function renderMovie(movieToRender: Movie = movie) {
  return render(
    <MemoryRouter>
      <MovieItem movie={movieToRender} />
    </MemoryRouter>,
  );
}

describe('MovieItem', () => {
  it('renders the movie card with its standard movie details', () => {
    // Arrange
    const expectedPosterUrl =
      'https://image.tmdb.org/t/p/w185/example-poster.jpg';
    const expectedHref = `/movies/${movie.id}`;
    const expectedMetadata = /2024 · Note 7\.5/;

    // Act
    renderMovie();

    // Assert: the card exposes the expected poster, title, link, and metadata.
    const moviePoster = screen.getByRole('img', {
      name: `Affiche de ${movie.title}`,
    });
    expect(moviePoster.getAttribute('src')).toBe(expectedPosterUrl);
    expect(
      screen.getByRole('heading', { level: 2, name: movie.title }),
    ).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe(expectedHref);
    expect(screen.getByText(expectedMetadata)).toBeTruthy();
  });

  it('omits the poster image when the movie has no poster', () => {
    // Arrange
    const movieWithoutPoster: Movie = { ...movie, poster_path: null };

    // Act
    renderMovie(movieWithoutPoster);

    // Assert: movie details remain available without a broken image.
    expect(
      screen.queryByRole('img', {
        name: `Affiche de ${movieWithoutPoster.title}`,
      }),
    ).toBeNull();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: movieWithoutPoster.title,
      }),
    ).toBeTruthy();
  });
});
