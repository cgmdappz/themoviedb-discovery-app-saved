import './MostRepresentedCountryWidget.css';

export type MostRepresentedCountryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'success'; country: string; count: number };

export interface MostRepresentedCountryWidgetProps {
  /** État du chargement ou pays le plus représenté et son nombre de films distincts, calculés par la source. */
  state: MostRepresentedCountryState;
}

export default function MostRepresentedCountryWidget({
  state,
}: MostRepresentedCountryWidgetProps) {
  return (
    <article
      className="most-represented-country-widget"
      aria-labelledby="most-represented-country-title"
    >
      <header>
        <p className="most-represented-country-eyebrow">Catalogue</p>
        <h2 id="most-represented-country-title">Pays le plus représenté</h2>
      </header>
      <div
        className="most-represented-country-content"
        aria-busy={state.status === 'loading'}
      >
        {state.status === 'loading' ? (
          <p role="status">Chargement du pays le plus représenté…</p>
        ) : state.status === 'error' ? (
          <p role="alert">Le pays le plus représenté n’a pas pu être chargé.</p>
        ) : state.status === 'empty' ? (
          <p role="status">Aucun pays de production connu.</p>
        ) : (
          <div className="most-represented-country-value">
            <p className="most-represented-country-name">{state.country}</p>
            <p>
              <strong>{state.count.toLocaleString('fr-FR')}</strong>{' '}
              <span>films</span>
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
