import { useEffect, useState } from 'react';
import MoviesInDatabaseWidget, {
  type MoviesInDatabaseState,
} from '../../components/MoviesInDatabaseWidget/MoviesInDatabaseWidget';
import './MovieDashboardPage.css';

export default function MovieDashboardPage() {
  const [moviesState, setMoviesState] = useState<MoviesInDatabaseState>({
    status: 'loading',
  });

  useEffect(() => {
    const loadMovieCount = async () => {
      try {
        const response = await fetch('/api/dashboard/movies/count');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: unknown = await response.json();
        const count = readMovieCount(data);
        setMoviesState({ status: 'success', count });
      } catch (error) {
        console.error('Error fetching movies in database:', error);
        setMoviesState({ status: 'error' });
      }
    };

    void loadMovieCount();
  }, []);

  return (
    <main className="app-shell movie-dashboard">
      <header className="app-header">
        <p className="movie-dashboard-eyebrow">TMDB Discovery</p>
        <h1>Tableau de bord des films</h1>
        <h2>
          Explorez les informations disponibles sur les films, leurs genres et
          leurs pays de production.
        </h2>
      </header>
      <section className="movie-dashboard-widgets" aria-label="Widgets">
        <MoviesInDatabaseWidget state={moviesState} />
      </section>
    </main>
  );
}

function readMovieCount(data: unknown): number {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('count' in data) ||
    typeof data.count !== 'number' ||
    !Number.isSafeInteger(data.count) ||
    data.count < 0
  ) {
    throw new Error('Invalid movies count response');
  }
  return data.count;
}
