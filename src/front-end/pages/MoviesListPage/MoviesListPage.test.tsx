// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../../../back-end/utils/constants';
import type { Movie } from '../../../back-end/types/MoviesTypes';
import MoviesListPage from './MoviesListPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState({}, '', '/');
});

const movie = {
  id: 123,
  title: 'Example Movie',
  release_date: '2024-05-10',
  vote_average: 7.456,
  poster_path: '/example-poster.jpg',
} as Movie;

function renderMoviesListPage() {
  return render(
    <MemoryRouter>
      <MoviesListPage />
    </MemoryRouter>,
  );
}

function mockMoviesResponse(results: Movie[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ results }),
    }),
  );
}

describe('MoviesListPage', () => {
  it('shows the loading state and renders movies fetched with URL parameters', async () => {
    // Arrange: provide query parameters and a mocked API response.
    window.history.replaceState({}, '', '/?language=fr-FR&page=2&region=FR');
    mockMoviesResponse([movie]);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act: render the page and wait for the fetched movie to appear.
    renderMoviesListPage();

    expect(screen.getByText('Loading...')).toBeTruthy();

    const movieHeading = await screen.findByRole('heading', {
      level: 2,
      name: movie.title,
    });

    // Assert: the request uses the URL parameters and the movie is displayed.
    expect(fetch).toHaveBeenCalledWith(
      '/api/movies/popular?language=fr-FR&page=2&region=FR',
    );
    expect(movieHeading).toBeTruthy();
    expect(
      screen
        .getByRole('img', { name: `Affiche de ${movie.title}` })
        .getAttribute('src'),
    ).toBe('https://image.tmdb.org/t/p/w185/example-poster.jpg');
    expect(
      screen
        .getByRole('link', { name: new RegExp(movie.title) })
        .getAttribute('href'),
    ).toBe(`/movies/${movie.id}`);
    expect(screen.queryByText('Loading...')).toBeNull();
  });

  it('uses the default query parameters when none are provided in the URL', async () => {
    // Arrange: mock an empty API response with no URL query parameters.
    mockMoviesResponse([]);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act: render the page and wait for the request to be issued.
    renderMoviesListPage();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Films populaires',
    });

    // Assert: the request uses the configured default values.
    expect(fetch).toHaveBeenCalledWith(
      `/api/movies/popular?language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
    );
  });

  it('shows an explicit message when the movies API returns an error', async () => {
    // Arrange: simulate the backend returning an HTTP error.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn(),
      }),
    );
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    renderMoviesListPage();

    // Assert: the loading state is replaced with visible troubleshooting help.
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Vérifiez le serveur et le jeton TMDB configuré côté backend.',
    );
    expect(screen.queryByText('Loading...')).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'Error loading popular movies:',
      expect.objectContaining({
        message: 'Movies API request failed with status 500',
      }),
    );
  });

  it('shows an explicit message when the movies API response is malformed', async () => {
    // Arrange: return a successful HTTP response with an invalid results value.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ results: 'not-an-array' }),
      }),
    );
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    renderMoviesListPage();

    // Assert: malformed data is logged and does not leave the page loading.
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Loading...')).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'Error loading popular movies:',
      expect.objectContaining({
        message: 'Movies API returned an invalid results list.',
      }),
    );
  });

  it('shows an empty state when the movies API returns no results', async () => {
    // Arrange: provide a successful response without any movies.
    mockMoviesResponse([]);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    renderMoviesListPage();

    // Assert: an empty result is distinct from loading or a failed request.
    expect(
      await screen.findByText("Aucun film n'a été renvoyé par TMDB."),
    ).toBeTruthy();
  });

  it('shows an explicit message when the network request fails', async () => {
    // Arrange: simulate a network failure before an HTTP response is received.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    renderMoviesListPage();

    // Assert: the network error is logged and the user sees the error state.
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(console.error).toHaveBeenCalledWith(
      'Error loading popular movies:',
      expect.objectContaining({ message: 'Network error' }),
    );
  });
});
