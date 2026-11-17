// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MovieDashboardPage from './MovieDashboardPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('MovieDashboardPage', () => {
  it('shows the dashboard and loading widget while the movie count is being fetched', () => {
    // Arrange: keep the API response pending while the page is displayed.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );

    // Act
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MovieDashboardPage />
      </MemoryRouter>,
    );

    // Assert: the dashboard displays the widget loading state.
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tableau de bord des films',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      'Chargement du nombre de films…',
    );
    expect(fetch).toHaveBeenCalledWith('/api/dashboard/movies/count');
  });

  it('shows the fetched movie count', async () => {
    // Arrange: return the count reported by the database API.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ count: 42 }),
      }),
    );

    // Act
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MovieDashboardPage />
      </MemoryRouter>,
    );

    // Assert: the movie count replaces the loading message.
    expect(await screen.findByText('42')).toBeTruthy();
    expect(screen.getByText('films enregistrés')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows the empty database message when the count is zero', async () => {
    // Arrange: return an empty movie count from the database API.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ count: 0 }),
      }),
    );

    // Act
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MovieDashboardPage />
      </MemoryRouter>,
    );

    // Assert: an empty database has a specific, non-error state.
    expect((await screen.findByRole('status')).textContent).toBe(
      'Aucun film n’est encore enregistré.',
    );
  });

  it.each([
    [
      'an HTTP failure',
      () => Promise.resolve({ ok: false, status: 500, json: vi.fn() }),
    ],
    ['a network failure', () => Promise.reject(new Error('Network failed'))],
  ])('shows the error state after %s', async (_scenario, fetchResult) => {
    // Arrange: make the API request fail.
    vi.stubGlobal('fetch', vi.fn(fetchResult));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MovieDashboardPage />
      </MemoryRouter>,
    );

    // Assert: the widget reports the failure instead of staying in loading.
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Le nombre de films en base n’a pas pu être chargé.',
    );
    expect(console.error).toHaveBeenCalledOnce();
  });

  it.each([
    ['a non-object response', null],
    ['a response without count', {}],
    ['a non-numeric count', { count: '2' }],
    ['a fractional count', { count: 1.5 }],
    ['a negative count', { count: -1 }],
  ])('shows the error state for %s', async (_scenario, data) => {
    // Arrange: return a malformed movie count from the database API.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(data),
      }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MovieDashboardPage />
      </MemoryRouter>,
    );

    // Assert: invalid API data is surfaced as an error state.
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
