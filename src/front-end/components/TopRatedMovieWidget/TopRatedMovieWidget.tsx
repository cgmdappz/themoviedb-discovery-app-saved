import { useState } from 'react';
import './TopRatedMovieWidget.css';

export interface TopRatedMovie {
  /** Titre du film. */
  title: string;
  /** Année de sortie, ou null si elle est inconnue. */
  year: number | null;
  /** Note du film sur 10. */
  rating: number;
  /** URL de l'affiche, ou null si elle est absente. */
  posterUrl: string | null;
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
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

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
          <div className="top-rated-movie-details">
            {state.movie.posterUrl &&
            state.movie.posterUrl !== failedPosterUrl ? (
              <img
                className="top-rated-movie-poster"
                src={state.movie.posterUrl}
                alt={`Affiche de ${state.movie.title}`}
                onError={() => setFailedPosterUrl(state.movie.posterUrl)}
              />
            ) : (
              <div
                className="top-rated-movie-poster top-rated-movie-placeholder"
                role="img"
                aria-label={`Affiche indisponible pour ${state.movie.title}`}
              >
                Affiche indisponible
              </div>
            )}
            <div className="top-rated-movie-copy">
              <h3>{state.movie.title}</h3>
              <p>{state.movie.year ?? 'Année inconnue'}</p>
              <p>
                <strong>
                  {state.movie.rating.toLocaleString('fr-FR', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </strong>{' '}
                <span>/ 10</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
