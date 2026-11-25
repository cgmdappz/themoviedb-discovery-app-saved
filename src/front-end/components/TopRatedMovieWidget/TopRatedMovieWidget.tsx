import DashboardMovieDetails, {
  type DashboardMovie,
} from '../DashboardMovieDetails/DashboardMovieDetails';
import './TopRatedMovieWidget.css';

export interface TopRatedMovie extends DashboardMovie {
  /** Note du film sur 10. */
  rating: number;
}

export type TopRatedMovieState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'success'; movie: TopRatedMovie };

export interface TopRatedMovieWidgetProps {
  /** État de chargement ou film le mieux noté, sélectionné par la source des données. */
  state: TopRatedMovieState;
}

export default function TopRatedMovieWidget({
  state,
}: TopRatedMovieWidgetProps) {
  return (
    <article
      className="top-rated-movie-widget"
      aria-labelledby="top-rated-movie-title"
    >
      <header>
        <p className="top-rated-movie-eyebrow">Catalogue</p>
        <h2 id="top-rated-movie-title">Film le mieux noté</h2>
      </header>
      <div
        className="top-rated-movie-content"
        aria-busy={state.status === 'loading'}
      >
        {state.status === 'loading' ? (
          <p role="status">Chargement du film le mieux noté…</p>
        ) : state.status === 'error' ? (
          <p role="alert">Le film le mieux noté n’a pas pu être chargé.</p>
        ) : state.status === 'empty' ? (
          <p role="status">Aucun film noté disponible.</p>
        ) : (
          <DashboardMovieDetails movie={state.movie}>
            <p>
              <strong>
                {state.movie.rating.toLocaleString('fr-FR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </strong>{' '}
              <span>/ 10</span>
            </p>
          </DashboardMovieDetails>
        )}
      </div>
    </article>
  );
}
