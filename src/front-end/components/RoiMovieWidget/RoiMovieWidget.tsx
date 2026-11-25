import DashboardMovieDetails, {
  type DashboardMovie,
} from '../DashboardMovieDetails/DashboardMovieDetails';
import './RoiMovieWidget.css';

export interface RoiMovie extends DashboardMovie {
  /** ROI déjà calculé en pourcentage, ou null si inconnu. */
  roi: number | null;
}

export type RoiMovieState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'success'; movie: RoiMovie };

const labels = {
  best: {
    id: 'best-roi-movie-title',
    title: 'Film au meilleur retour sur investissement',
    loading: 'Chargement du film au meilleur ROI…',
    error: 'Le film au meilleur ROI n’a pas pu être chargé.',
  },
  worst: {
    id: 'lowest-roi-movie-title',
    title: 'Film au plus faible retour sur investissement',
    loading: 'Chargement du film au plus faible ROI…',
    error: 'Le film au plus faible ROI n’a pas pu être chargé.',
  },
} as const;

interface RoiMovieWidgetProps {
  state: RoiMovieState;
  kind: keyof typeof labels;
}

export default function RoiMovieWidget({ state, kind }: RoiMovieWidgetProps) {
  const label = labels[kind];

  return (
    <article className="roi-movie-widget" aria-labelledby={label.id}>
      <header>
        <p className="roi-movie-eyebrow">Catalogue</p>
        <h2 id={label.id}>{label.title}</h2>
      </header>
      <div className="roi-movie-content" aria-busy={state.status === 'loading'}>
        {state.status === 'loading' ? (
          <p role="status">{label.loading}</p>
        ) : state.status === 'error' ? (
          <p role="alert">{label.error}</p>
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
