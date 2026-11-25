import { useState, type ReactNode } from 'react';
import './DashboardMovieDetails.css';

export interface DashboardMovie {
  /** Titre du film. */
  title: string;
  /** Année de sortie, ou null si elle est inconnue. */
  year: number | null;
  /** URL de l'affiche, ou null si elle est absente. */
  posterUrl: string | null;
}

interface DashboardMovieDetailsProps {
  movie: DashboardMovie;
  children: ReactNode;
}

export default function DashboardMovieDetails({
  movie,
  children,
}: DashboardMovieDetailsProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  return (
    <div className="dashboard-movie-details">
      {movie.posterUrl && movie.posterUrl !== failedPosterUrl ? (
        <img
          className="dashboard-movie-poster"
          src={movie.posterUrl}
          alt={`Affiche de ${movie.title}`}
          onError={() => setFailedPosterUrl(movie.posterUrl)}
        />
      ) : (
        <div
          className="dashboard-movie-poster dashboard-movie-placeholder"
          role="img"
          aria-label={`Affiche indisponible pour ${movie.title}`}
        >
          Affiche indisponible
        </div>
      )}
      <div className="dashboard-movie-copy">
        <h3>{movie.title}</h3>
        <p>{movie.year ?? 'Année inconnue'}</p>
        {children}
      </div>
    </div>
  );
}
