import './AverageMovieRatingWidget.css';

export type AverageMovieRatingState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'success'; rating: number };

export interface AverageMovieRatingWidgetProps {
  /** État ou moyenne arithmétique non pondérée des notes connues du catalogue, sur 10. */
  state: AverageMovieRatingState;
}

export default function AverageMovieRatingWidget({
  state,
}: AverageMovieRatingWidgetProps) {
  return (
    <article
      className="average-rating-widget"
      aria-labelledby="average-rating-title"
    >
      <header>
        <p className="average-rating-eyebrow">Catalogue</p>
        <h2 id="average-rating-title">Note moyenne</h2>
        <p className="average-rating-description">
          Moyenne simple non pondérée
        </p>
      </header>
      <div
        className="average-rating-content"
        aria-busy={state.status === 'loading'}
      >
        {state.status === 'loading' ? (
          <p role="status">Chargement de la note moyenne…</p>
        ) : state.status === 'error' ? (
          <p role="alert">La note moyenne n’a pas pu être chargée.</p>
        ) : state.status === 'empty' ? (
          <p role="status">Aucune note de film disponible.</p>
        ) : (
          <p className="average-rating-value">
            <strong>
              {state.rating.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
            <span>/ 10</span>
          </p>
        )}
      </div>
    </article>
  );
}
