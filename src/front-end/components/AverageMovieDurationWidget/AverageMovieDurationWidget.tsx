import './AverageMovieDurationWidget.css';

export type AverageMovieDurationState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'success'; minutes: number };

export interface AverageMovieDurationWidgetProps {
  /** État du chargement ou moyenne calculée sur les durées strictement positives, en minutes. */
  state: AverageMovieDurationState;
}

export default function AverageMovieDurationWidget({
  state,
}: AverageMovieDurationWidgetProps) {
  return (
    <article
      className="average-duration-widget"
      aria-labelledby="average-duration-title"
    >
      <header>
        <p className="average-duration-eyebrow">Catalogue</p>
        <h2 id="average-duration-title">Durée moyenne</h2>
      </header>
      <div
        className="average-duration-content"
        aria-busy={state.status === 'loading'}
      >
        {state.status === 'loading' ? (
          <p role="status">Chargement de la durée moyenne…</p>
        ) : state.status === 'error' ? (
          <p role="alert">La durée moyenne n’a pas pu être chargée.</p>
        ) : state.status === 'empty' ? (
          <p role="status">Aucune durée de film disponible.</p>
        ) : (
          <p className="average-duration-value">
            <strong>
              {state.minutes.toLocaleString('fr-FR', {
                maximumFractionDigits: 20,
              })}
            </strong>
            <span>min</span>
          </p>
        )}
      </div>
    </article>
  );
}
