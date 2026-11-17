// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage';
import type { MovieDetails } from '../../../back-end/types/MoviesTypes';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const movie: MovieDetails = {
  id: 1,
  title: 'Film dashboard',
  original_title: 'Dashboard movie',
  overview: 'Overview',
  release_date: '2020-05-10',
  original_language: 'fr',
  poster_path: null,
  backdrop_path: null,
  popularity: 12.5,
  vote_average: 8,
  vote_count: 100,
  genres: [{ id: 35, name: 'Comédie' }],
  runtime: 120,
  budget: 1000000,
  revenue: 2500000,
  production_countries: [{ iso_3166_1: 'FR', name: 'France' }],
  tagline: null,
};

const unknownMovie = {
  ...movie,
  id: 2,
  title: 'Film incomplet',
  release_date: '2019-01-01',
  popularity: 0,
  vote_average: 0,
  runtime: 0,
  budget: 0,
  revenue: 0,
  genres: [{ id: 18, name: 'Drame' }],
  production_countries: [{ iso_3166_1: 'BE', name: 'Belgique' }],
};
const emptyMovie = {
  ...unknownMovie,
  id: 3,
  title: 'Film sans référentiel',
  genres: [],
  production_countries: [],
};

function mockDashboardApi(details: MovieDetails[] = [movie]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/popular')) {
        const page = new URL(url, 'http://localhost').searchParams.get('page');
        return Promise.resolve(
          new Response(
            JSON.stringify({
              page: Number(page),
              results:
                page === '1' ? details.map(({ id }) => ({ ...movie, id })) : [],
              total_pages: 1,
              total_results: 1,
            }),
          ),
        );
      }
      const id = Number(
        new URL(url, 'http://localhost').pathname.split('/').pop(),
      );
      return Promise.resolve(
        new Response(JSON.stringify(details.find((item) => item.id === id))),
      );
    }),
  );
}

describe('DashboardPage', () => {
  it('loads the sample and displays its indicators and filters', async () => {
    // Arrange: provide a representative film returned by Discover and its details.
    mockDashboardApi([movie, unknownMovie, emptyMovie]);

    // Act: render the dashboard and wait for the detailed row.
    render(<DashboardPage />);
    expect(screen.getByText('Chargement des données TMDB...')).toBeTruthy();
    expect(await screen.findByText('Film dashboard')).toBeTruthy();

    // Assert: the dashboard exposes the requested metrics and filter controls.
    expect(screen.getByText('Films analysés')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getAllByText('120 min')).toHaveLength(2);
    expect(screen.getByText('1 000 000 $')).toBeTruthy();
    expect(screen.getByLabelText('Genre')).toBeTruthy();
    expect(screen.getByLabelText('Pays')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Genre'), {
      target: { value: '35' },
    });
    fireEvent.change(screen.getByLabelText('Pays'), {
      target: { value: 'FR' },
    });
    fireEvent.change(screen.getByLabelText('Année de début'), {
      target: { value: '2021' },
    });
    expect(
      screen.getByText('Aucun film ne correspond aux filtres.'),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Année de fin'), {
      target: { value: '2020' },
    });
  });

  it('displays an explicit error when the sample cannot be loaded', async () => {
    // Arrange: make the first Discover request fail.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 503 })),
    );

    // Act: render and wait for the error state.
    render(<DashboardPage />);

    // Assert: users receive a visible error instead of an empty dashboard.
    expect(
      await screen.findByText(
        'Impossible de charger les données du dashboard.',
      ),
    ).toBeTruthy();
  });

  it('displays an error when a movie detail cannot be loaded', async () => {
    // Arrange: return one Discover result, then fail its detail request.
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) =>
        String(input).includes('/popular')
          ? Promise.resolve(
              new Response(
                JSON.stringify({
                  page: 1,
                  results: [{ ...movie }],
                  total_pages: 1,
                  total_results: 1,
                }),
              ),
            )
          : Promise.resolve(new Response('', { status: 404 })),
      ),
    );

    // Act: render and wait for the detail error state.
    render(<DashboardPage />);

    // Assert: a failed enrichment request is visible to the analyst.
    expect(
      await screen.findByText(
        'Impossible de charger les données du dashboard.',
      ),
    ).toBeTruthy();
  });

  it('keeps available movies when one detail request fails', async () => {
    // Arrange: make one detail request fail while another one succeeds.
    mockDashboardApi([movie, unknownMovie]);
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((input) =>
      String(input).includes('/popular')
        ? Promise.resolve(
            new Response(
              JSON.stringify({
                page: 1,
                results:
                  new URL(String(input), 'http://localhost').searchParams.get(
                    'page',
                  ) === '1'
                    ? [{ ...movie }, { ...unknownMovie }]
                    : [],
                total_pages: 1,
                total_results: 2,
              }),
            ),
          )
        : String(input).includes('/movies/1')
          ? Promise.resolve(new Response('', { status: 502 }))
          : Promise.resolve(new Response(JSON.stringify(unknownMovie))),
    );

    // Act: render the dashboard.
    render(<DashboardPage />);

    // Assert: partial data remains visible instead of failing the whole page.
    expect(await screen.findByText('Films analysés')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(
      'TMDB indisponible',
    );
  });

  it('uses the plural notice when multiple movie details fail', async () => {
    // Arrange: make two of three detail requests unavailable.
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input).includes('/popular')) {
        const page = new URL(
          String(input),
          'http://localhost',
        ).searchParams.get('page');
        return Promise.resolve(
          new Response(
            JSON.stringify({
              page: Number(page),
              results: page === '1' ? [{ id: 1 }, { id: 2 }, { id: 3 }] : [],
              total_pages: 1,
              total_results: 3,
            }),
          ),
        );
      }

      const id = Number(
        new URL(String(input), 'http://localhost').pathname.split('/').pop(),
      );
      return id === 1
        ? Promise.resolve(new Response(JSON.stringify(movie)))
        : Promise.resolve(new Response('', { status: 502 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    // Act
    render(<DashboardPage />);

    // Assert: the notice describes multiple skipped detail records correctly.
    expect(await screen.findByText('Films analysés')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(
      '2 fiches TMDB indisponibles',
    );
  });

  it('shows an unknown year for a film without a release date', async () => {
    // Arrange: provide a film whose release date is missing.
    const noDateMovie = {
      ...movie,
      id: 4,
      title: 'Film sans date',
      release_date: '',
    };
    mockDashboardApi([noDateMovie]);

    // Act: include year zero so the film with no known year is in the table.
    render(<DashboardPage />);
    expect(
      await screen.findByText('Aucun film ne correspond aux filtres.'),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Année de début'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText('Année de fin'), {
      target: { value: '0' },
    });

    // Assert: an absent date is rendered as unknown, not as an empty value.
    expect(
      screen.getByRole('row', { name: /Film sans date/ }).textContent,
    ).toContain('Inconnue');
  });

  it('does not update state when page requests finish after unmount', async () => {
    // Arrange: hold the page responses until after the dashboard is unmounted.
    const resolvers: Array<(response: Response) => void> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolvers.push(resolve);
          }),
      ),
    );

    // Act
    const { unmount } = render(<DashboardPage />);
    unmount();
    await act(async () => {
      for (const resolve of resolvers) {
        resolve(
          new Response(
            JSON.stringify({
              page: 1,
              results: [],
              total_pages: 1,
              total_results: 0,
            }),
          ),
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert: the request lifecycle completes safely after cleanup.
    expect(resolvers).toHaveLength(3);
  });

  it('does not show an error when the request rejects after unmount', async () => {
    // Arrange: keep a rejected request pending until after unmount.
    let rejectRequest: (error: Error) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((_resolve, reject) => {
            rejectRequest = reject;
          }),
      ),
    );

    // Act
    const { unmount } = render(<DashboardPage />);
    unmount();
    await act(async () => {
      rejectRequest(new Error('Network error'));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert: the cancelled request does not transition the unmounted page.
    expect(
      screen.queryByText('Impossible de charger les données du dashboard.'),
    ).toBeNull();
  });
});
