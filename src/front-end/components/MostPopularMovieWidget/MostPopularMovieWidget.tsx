import DashboardMovieDetails, {
  type DashboardMovie,
} from '../DashboardMovieDetails/DashboardMovieDetails';
import './MostPopularMovieWidget.css';

export interface MostPopularMovie extends DashboardMovie {
  /** Indice de popularité TMDB, ou null si la valeur est inconnue. */
  popularity: number | null;
}

export type MostPopularMovieState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'success'; movie: MostPopularMovie };

export interface MostPopularMovieWidgetProps {
  /** État ou film le plus populaire sélectionné par la source des données. */
  state: MostPopularMovieState;
}

export default function MostPopularMovieWidget({
  state,
}: MostPopularMovieWidgetProps) {
  return (
    <article
      className="most-popular-movie-widget"
      aria-labelledby="most-popular-movie-title"
    >
      <header>
        <p className="most-popular-movie-eyebrow">Catalogue</p>
        <h2 id="most-popular-movie-title">Film le plus populaire</h2>
      </header>
      <div
        className="most-popular-movie-content"
        aria-busy={state.status === 'loading'}
      >
        {state.status === 'loading' ? (
          <p role="status">Chargement du film le plus populaire…</p>
        ) : state.status === 'error' ? (
          <p role="alert">Le film le plus populaire n’a pas pu être chargé.</p>
        ) : state.status === 'empty' ? (
          <p role="status">Aucun film disponible.</p>
        ) : (
          <DashboardMovieDetails movie={state.movie}>
            {state.movie.popularity === null ? (
              <p>Popularité inconnue</p>
            ) : (
              <p>
                <strong>
                  {state.movie.popularity.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>{' '}
                <span>popularité</span>
              </p>
            )}
          </DashboardMovieDetails>
        )}
      </div>
    </article>
  );
}
