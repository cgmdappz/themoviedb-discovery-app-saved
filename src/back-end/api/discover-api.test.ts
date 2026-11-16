import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import { registerDiscoverApi } from './discover-api';
import type { TmdbMoviesRawResponse } from '../types/MoviesTypes';

const { accessToken, convertMovie } = vi.hoisted(() => ({
  accessToken: { value: 'header.payload.signature' },
  convertMovie: vi.fn(),
}));

vi.mock('../utils/config', () => ({
  get tmdbAccessToken() {
    return accessToken.value;
  },
}));

vi.mock('../utils/converter', () => ({
  toSupportedMovie: convertMovie,
  toSupportedMovieDetails: vi.fn(),
}));

type RouteHandler = (
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
) => void | Promise<void>;

const handlers = new Map<string, RequestHandler>();
const app = {
  get: (path: string, handler: RequestHandler) => handlers.set(path, handler),
} as unknown as Express;

function getDiscoverHandler(): RouteHandler {
  const handler = handlers.get('/api/discover/movies');
  if (!handler) throw new Error('Discover route was not registered');
  return handler as RouteHandler;
}

function createResponse() {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

function tmdbResponse(
  body: unknown,
  options: { ok?: boolean; status?: number } = {},
): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('GET /api/discover/movies', () => {
  beforeEach(() => {
    handlers.clear();
    accessToken.value = 'header.payload.signature';
    convertMovie.mockReset();
    registerDiscoverApi(app);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('passes primary_release_year, defaults, and converts returned movies', async () => {
    // Arrange: make TMDB return one raw movie and configure its supported form.
    const rawMovie = { id: 1, adult: false, video: false };
    const rawData = {
      page: 1,
      results: [rawMovie],
      total_pages: 4,
      total_results: 72,
    } as unknown as TmdbMoviesRawResponse;
    const supportedMovie = { id: 1, title: 'Film' };
    const fetchMock = vi.fn().mockResolvedValue(tmdbResponse(rawData));
    vi.stubGlobal('fetch', fetchMock);
    convertMovie.mockReturnValue(supportedMovie);
    const response = createResponse();

    // Act
    await getDiscoverHandler()(
      { query: { year: '2020' } } as unknown as Request,
      response,
      vi.fn(),
    );

    // Assert: only one Discover page is requested using defaults and the server token.
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=fr-FR&page=1&region=FR',
      {
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          Authorization: 'Bearer header.payload.signature',
        },
      },
    );
    expect(convertMovie.mock.calls[0]?.[0]).toBe(rawMovie);
    expect(response.json).toHaveBeenCalledWith({
      page: 1,
      results: [supportedMovie],
      total_pages: 4,
      total_results: 72,
    });
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(
      accessToken.value,
    );
  });

  it('passes custom language, page, and region values', async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue(
      tmdbResponse({
        page: 2,
        results: [],
        total_pages: 2,
        total_results: 0,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();

    // Act
    await getDiscoverHandler()(
      {
        query: {
          year: '2020',
          language: 'en-US',
          page: '2',
          region: 'US',
        },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=en-US&page=2&region=US',
      expect.any(Object),
    );
    expect(response.json).toHaveBeenCalledWith({
      page: 2,
      results: [],
      total_pages: 2,
      total_results: 0,
    });
    expect(convertMovie).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    '',
    '999',
    '0999',
    '10000',
    '20a0',
    ['2020', '2021'],
    { year: '2020' },
  ])('rejects invalid year values without calling TMDB (%s)', async (year) => {
    // Arrange
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();

    // Act
    await getDiscoverHandler()(
      { query: { year } } as unknown as Request,
      response,
      vi.fn(),
    );

    // Assert
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: 'year must be a four-digit year between 1000 and 9999',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('defaults non-string and empty optional values', async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue(
      tmdbResponse({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();

    // Act
    await getDiscoverHandler()(
      {
        query: {
          year: '9999',
          language: '',
          page: ['2'],
          region: { code: 'US' },
        },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.themoviedb.org/3/discover/movie?primary_release_year=9999&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
      expect.any(Object),
    );
  });

  it('logs and returns an explicit error for HTTP, network, and JSON failures', async () => {
    // Arrange
    const httpFailure = vi
      .fn()
      .mockResolvedValue(tmdbResponse({}, { ok: false, status: 502 }));
    const networkFailure = vi
      .fn()
      .mockRejectedValue(new Error('Network error'));
    const jsonFailure = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementationOnce(httpFailure)
        .mockImplementationOnce(networkFailure)
        .mockImplementationOnce(jsonFailure),
    );

    // Act and assert: every upstream failure is logged and becomes HTTP 500.
    for (let index = 0; index < 3; index += 1) {
      const response = createResponse();
      await getDiscoverHandler()(
        { query: { year: '2020' } } as unknown as Request,
        response,
        vi.fn(),
      );
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Failed to discover movies',
      });
    }

    expect(console.error).toHaveBeenCalledTimes(3);
    expect(convertMovie).not.toHaveBeenCalled();
  });
});
