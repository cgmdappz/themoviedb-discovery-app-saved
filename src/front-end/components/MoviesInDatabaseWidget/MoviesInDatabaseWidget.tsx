import './MoviesInDatabaseWidget.css';

export type MoviesInDatabaseState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; count: number };

interface MoviesInDatabaseWidgetProps {
  state: MoviesInDatabaseState;
}

export default function MoviesInDatabaseWidget({
  state,
}: MoviesInDatabaseWidgetProps) {
  return (
    <article
      className="movies-in-database-widget"
      aria-labelledby="movies-in-database-title"
    >
      <header>
        <p className="movies-in-database-eyebrow">Catalogue</p>
        <h2 id="movies-in-database-title">Films en base</h2>
      </header>
      <div
        className="movies-in-database-content"
        aria-busy={state.status === 'loading'}
      >
        {state.status === 'loading' ? (
          <p role="status">Chargement du nombre de films…</p>
        ) : state.status === 'error' ? (
          <p role="alert">Le nombre de films en base n’a pas pu être chargé.</p>
        ) : state.count === 0 ? (
          <p role="status">Aucun film n’est encore enregistré.</p>
        ) : (
          <p className="movies-in-database-count">
            <strong>
              {new Intl.NumberFormat('fr-FR').format(state.count)}
            </strong>
            <span>
              {state.count === 1 ? 'film enregistré' : 'films enregistrés'}
            </span>
          </p>
        )}
      </div>
    </article>
  );
}
