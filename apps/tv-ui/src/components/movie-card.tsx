import type { MovieSummary } from "@netphim/tv-contracts";
import { ImageBroken } from "@phosphor-icons/react";
import { useState } from "react";

type MovieCardProps = {
  movie: MovieSummary;
  focusId: string;
  focusRow: number;
  onSelect: (movie: MovieSummary) => void;
};

export function MovieCard({ movie, focusId, focusRow, onSelect }: MovieCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      className="movie-card"
      data-tv-focusable="true"
      data-focus-id={focusId}
      data-focus-row={focusRow}
      onClick={() => onSelect(movie)}
      aria-label={`Mở ${movie.title}`}
    >
      <span className="movie-card__artwork">
        {imageFailed ? (
          <span className="movie-card__fallback" aria-hidden="true">
            <ImageBroken />
          </span>
        ) : (
          <img
            src={movie.poster.src}
            alt={movie.poster.alt}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
        {movie.quality && <span className="movie-card__quality">{movie.quality}</span>}
        {movie.progressPercent !== undefined && (
          <span className="movie-card__progress" aria-hidden="true">
            <span style={{ width: `${movie.progressPercent}%` }} />
          </span>
        )}
      </span>
      <span className="movie-card__title">{movie.title}</span>
      {movie.year && <span className="movie-card__year">{movie.year}</span>}
    </button>
  );
}
