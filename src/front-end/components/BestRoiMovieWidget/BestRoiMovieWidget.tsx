import DashboardMovieDetails, {
  type DashboardMovie,
} from '../DashboardMovieDetails/DashboardMovieDetails';
import './BestRoiMovieWidget.css';

export interface BestRoiMovie extends DashboardMovie {
  /** ROI déjà calculé en pourcentage, ou null si inconnu. */
  roi: number | null;
}

export type BestRoiMovieState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'success'; movie: BestRoiMovie };

export interface BestRoiMovieWidgetProps {
  /** État ou film sélectionné et ROI fourni par la source des données. */
  state: BestRoiMovieState;
}

export default function BestRoiMovieWidget({ state }: BestRoiMovieWidgetProps) {
  return (
    <article
      className="best-roi-movie-widget"
      aria-labelledby="best-roi-movie-title"
    >
      <header>
        <p className="best-roi-movie-eyebrow">Catalogue</p>
        <h2 id="best-roi-movie-title">
          Film au meilleur retour sur investissement
        </h2>
      </header>
      <div
        className="best-roi-movie-content"
        aria-busy={state.status === 'loading'}
      >
        {state.status === 'loading' ? (
          <p role="status">Chargement du film au meilleur ROI…</p>
        ) : state.status === 'error' ? (
          <p role="alert">Le film au meilleur ROI n’a pas pu être chargé.</p>
        ) : state.status === 'empty' ? (
          <p role="status">Aucun film éligible disponible.</p>
        ) : (
          <DashboardMovieDetails movie={state.movie}>
            {state.movie.roi === null ? (
              <p>ROI inconnu</p>
            ) : (
              <p>
                <strong>
                  {state.movie.roi.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>{' '}
                <span>% ROI</span>
              </p>
            )}
          </DashboardMovieDetails>
        )}
      </div>
    </article>
  );
}
