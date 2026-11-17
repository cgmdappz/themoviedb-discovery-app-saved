import { useEffect, useMemo, useState } from 'react';
import type {
  MovieDetails,
  MoviesApiResponse,
} from '../../../back-end/types/MoviesTypes';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_REGION,
} from '../../../back-end/utils/constants';
import './DashboardPage.css';

type DashboardMovie = MovieDetails;

const UNKNOWN = 'Inconnue';

function formatNumber(value: number | null | undefined): string {
  return value == null || value <= 0
    ? UNKNOWN
    : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(
        value,
      );
}

function formatCurrency(value: number): string {
  return value > 0
    ? `${new Intl.NumberFormat('fr-FR').format(value)} $`
    : UNKNOWN;
}

export default function DashboardPage() {
  const [movies, setMovies] = useState<DashboardMovie[]>([]);
  const [fromYear, setFromYear] = useState(2015);
  const [toYear, setToYear] = useState(2024);
  const [genre, setGenre] = useState('all');
  const [country, setCountry] = useState('all');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [skippedMovies, setSkippedMovies] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      try {
        const pages = await Promise.all(
          [1, 2, 3].map((page) =>
            fetch(
              `/api/movies/popular?language=${DEFAULT_LANGUAGE}&page=${page}&region=${DEFAULT_REGION}`,
            ).then((response) => {
              if (!response.ok) throw new Error('Unable to load movies');
              return response.json() as Promise<MoviesApiResponse>;
            }),
          ),
        );
        const discovered = pages.flatMap((page) => page.results);
        const detailResults = await Promise.all(
          discovered.map((movie) =>
            fetch(
              `/api/movies/${movie.id}?language=${DEFAULT_LANGUAGE}&region=${DEFAULT_REGION}`,
            )
              .then((response) => {
                if (!response.ok)
                  throw new Error('Unable to load movie details');
                return response.json() as Promise<MovieDetails>;
              })
              .catch(() => null),
          ),
        );
        const details = detailResults.filter(
          (detail): detail is MovieDetails => detail !== null,
        );
        if (!cancelled) {
          setMovies(details);
          setSkippedMovies(detailResults.length - details.length);
          setStatus(details.length > 0 ? 'ready' : 'error');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const genres = useMemo(
    () =>
      [
        ...new Map(
          movies
            .flatMap((movie) => movie.genres)
            .map((item) => [item.id, item]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    [movies],
  );
  const countries = useMemo(
    () =>
      [
        ...new Map(
          movies
            .flatMap((movie) => movie.production_countries)
            .map((item) => [item.iso_3166_1, item]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    [movies],
  );
  const filteredMovies = movies.filter((movie) => {
    const year = Number(movie.release_date.slice(0, 4));
    return (
      year >= fromYear &&
      year <= toYear &&
      (genre === 'all' ||
        movie.genres.some((item) => String(item.id) === genre)) &&
      (country === 'all' ||
        movie.production_countries.some((item) => item.iso_3166_1 === country))
    );
  });
  const averageRating =
    filteredMovies
      .filter((movie) => movie.vote_average > 0)
      .reduce((sum, movie) => sum + movie.vote_average, 0) /
    (filteredMovies.filter((movie) => movie.vote_average > 0).length || 1);
  const averageRuntime =
    filteredMovies
      .filter((movie) => movie.runtime > 0)
      .reduce((sum, movie) => sum + movie.runtime, 0) /
    (filteredMovies.filter((movie) => movie.runtime > 0).length || 1);

  return (
    <main className="app-shell dashboard-page">
      <header className="app-header">
        <p className="dashboard-kicker">Analyse TMDB</p>
        <h1>Dashboard des films</h1>
        <h2>
          Comparez les films de l’échantillon par année, genre et pays de
          production.
        </h2>
      </header>

      <section className="dashboard-filters" aria-label="Filtres du dashboard">
        <label>
          Année de début
          <input
            type="number"
            min="1900"
            max="2100"
            value={fromYear}
            onChange={(event) => setFromYear(Number(event.target.value))}
          />
        </label>
        <label>
          Année de fin
          <input
            type="number"
            min="1900"
            max="2100"
            value={toYear}
            onChange={(event) => setToYear(Number(event.target.value))}
          />
        </label>
        <label>
          Genre
          <select
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
          >
            <option value="all">Tous les genres</option>
            {genres.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pays
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          >
            <option value="all">Tous les pays</option>
            {countries.map((item) => (
              <option key={item.iso_3166_1} value={item.iso_3166_1}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {status === 'loading' && (
        <p className="status-message">Chargement des données TMDB...</p>
      )}
      {status === 'error' && (
        <p className="status-message">
          Impossible de charger les données du dashboard.
        </p>
      )}
      {status === 'ready' && (
        <>
          {skippedMovies > 0 && (
            <p className="dashboard-notice" role="status">
              {skippedMovies} fiche{skippedMovies > 1 ? 's' : ''} TMDB
              indisponible{skippedMovies > 1 ? 's' : ''} ; les autres films sont
              affichés.
            </p>
          )}
          <section className="dashboard-metrics" aria-label="Indicateurs">
            <article>
              <span>Films analysés</span>
              <strong>{filteredMovies.length}</strong>
            </article>
            <article>
              <span>Note moyenne</span>
              <strong>
                {averageRating > 0
                  ? `${averageRating.toFixed(1)} / 10`
                  : UNKNOWN}
              </strong>
            </article>
            <article>
              <span>Durée moyenne</span>
              <strong>
                {averageRuntime > 0
                  ? `${Math.round(averageRuntime)} min`
                  : UNKNOWN}
              </strong>
            </article>
            <article>
              <span>Popularité moyenne</span>
              <strong>
                {formatNumber(
                  filteredMovies.reduce(
                    (sum, movie) => sum + movie.popularity,
                    0,
                  ) / (filteredMovies.length || 1),
                )}
              </strong>
            </article>
          </section>
          <section
            className="dashboard-table-wrap"
            aria-label="Données des films"
          >
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Film</th>
                  <th>Année</th>
                  <th>Genres</th>
                  <th>Pays</th>
                  <th>Note</th>
                  <th>Popularité</th>
                  <th>Durée</th>
                  <th>Budget</th>
                  <th>Recettes</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovies.map((movie) => (
                  <tr key={movie.id}>
                    <th scope="row">{movie.title}</th>
                    <td>{movie.release_date.slice(0, 4) || UNKNOWN}</td>
                    <td>
                      {movie.genres.map((item) => item.name).join(', ') ||
                        UNKNOWN}
                    </td>
                    <td>
                      {movie.production_countries
                        .map((item) => item.name)
                        .join(', ') || UNKNOWN}
                    </td>
                    <td>{formatNumber(movie.vote_average)}</td>
                    <td>{formatNumber(movie.popularity)}</td>
                    <td>
                      {movie.runtime > 0 ? `${movie.runtime} min` : UNKNOWN}
                    </td>
                    <td>{formatCurrency(movie.budget)}</td>
                    <td>{formatCurrency(movie.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMovies.length === 0 && (
              <p className="status-message">
                Aucun film ne correspond aux filtres.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
