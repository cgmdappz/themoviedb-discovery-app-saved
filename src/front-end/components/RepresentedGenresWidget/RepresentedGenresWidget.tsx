import './RepresentedGenresWidget.css';

export type RepresentedGenresState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'success'; count: number };

export interface RepresentedGenresWidgetProps {
  /** État ou nombre entier non négatif de genres distincts, fourni par la source. */
  state: RepresentedGenresState;
}

export default function RepresentedGenresWidget({
  state,
}: RepresentedGenresWidgetProps) {
  return (
    <article
      className="represented-genres-widget"
      aria-labelledby="represented-genres-title"
    >
      <header>
        <p className="represented-genres-eyebrow">Diversité du catalogue</p>
        <h2 id="represented-genres-title">Genres représentés</h2>
      </header>
      <div
        className="represented-genres-content"
        aria-busy={state.status === 'loading'}
      >
        {state.status === 'loading' ? (
          <p role="status">Chargement du nombre de genres…</p>
        ) : state.status === 'error' ? (
          <p role="alert">Le nombre de genres n’a pas pu être chargé.</p>
        ) : state.status === 'empty' ? (
          <p role="status">Nombre de genres inconnu.</p>
        ) : (
          <p className="represented-genres-count">
            <strong>
              {new Intl.NumberFormat('fr-FR').format(state.count)}
            </strong>
            <span>genres</span>
          </p>
        )}
      </div>
    </article>
  );
}
