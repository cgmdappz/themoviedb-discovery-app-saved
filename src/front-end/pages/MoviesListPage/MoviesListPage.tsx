import { useEffect, useState } from 'react';
import MovieItem from '../../components/MovieItem/MovieItem';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../../../back-end/utils/constants';
import type {
  Movie,
  MoviesApiResponse,
} from '../../../back-end/types/MoviesTypes';

export default function MoviesListPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    async function loadMovies() {
      const urlParams = new URLSearchParams(window.location.search);
      const language = urlParams.get('language') || DEFAULT_LANGUAGE;
      const page = urlParams.get('page') || DEFAULT_PAGE;
      const region = urlParams.get('region') || DEFAULT_REGION;

      console.log('Query Params from frontend:', { language, page, region });

      try {
        const response = await fetch(
          `/api/movies/popular?language=${language}&page=${page}&region=${region}`,
        );
        if (!response.ok) {
          throw new Error(
            `Movies API request failed with status ${response.status}`,
          );
        }

        const data = (await response.json()) as MoviesApiResponse;
        if (!Array.isArray(data.results)) {
          throw new Error('Movies API returned an invalid results list.');
        }

        setMovies(data.results);
        setStatus('ready');
      } catch (error) {
        console.error('Error loading popular movies:', error);
        setStatus('error');
      }
    }

    void loadMovies();
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Films populaires</h1>
        <h2>
          Films tendances en France, d'après les données de{' '}
          <b>The Movie Database</b>
        </h2>
      </header>
      <section>
        {status === 'loading' && <p className="status-message">Loading...</p>}
        {status === 'error' && (
          <p className="status-message" role="alert">
            Impossible de charger les films. Vérifiez le serveur et le jeton
            TMDB configuré côté backend.
          </p>
        )}
        {status === 'ready' && movies.length === 0 && (
          <p className="status-message" role="status">
            Aucun film n'a été renvoyé par TMDB.
          </p>
        )}
        {status === 'ready' && movies.length > 0 && (
          <ul className="movie-grid">
            {movies.map((movie) => (
              <li key={movie.id}>
                <article>
                  <MovieItem movie={movie} />
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
