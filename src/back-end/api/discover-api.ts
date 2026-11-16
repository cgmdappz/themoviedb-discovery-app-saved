import type { Express, Request, Response } from 'express';
import { createTmdbRequest } from './movies-api';
import { toSupportedMovie } from '../utils/converter';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import type {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';

function getStringQueryValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function registerDiscoverApi(app: Express): void {
  app.get(
    '/api/discover/movies',
    async (req: Request, res: Response): Promise<void> => {
      const year = req.query.year;
      if (
        typeof year !== 'string' ||
        !/^[0-9]{4}$/.test(year) ||
        Number(year) < 1000 ||
        Number(year) > 9999
      ) {
        res.status(400).json({
          error: 'year must be a four-digit year between 1000 and 9999',
        });
        return;
      }

      const queryParams = new URLSearchParams({
        primary_release_year: year,
        language: getStringQueryValue(req.query.language) ?? DEFAULT_LANGUAGE,
        page: getStringQueryValue(req.query.page) ?? String(DEFAULT_PAGE),
        region: getStringQueryValue(req.query.region) ?? DEFAULT_REGION,
      });

      try {
        const [url, options] = createTmdbRequest('discover/movie', queryParams);
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        const rawData = (await response.json()) as TmdbMoviesRawResponse;
        const data: MoviesApiResponse = {
          page: rawData.page,
          results: rawData.results.map(toSupportedMovie),
          total_pages: rawData.total_pages,
          total_results: rawData.total_results,
        };
        res.json(data);
      } catch (error) {
        console.error('Error discovering movies:', error);
        res.status(500).json({ error: 'Failed to discover movies' });
      }
    },
  );
}
