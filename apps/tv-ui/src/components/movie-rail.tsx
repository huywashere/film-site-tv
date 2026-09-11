import type { HomeSection, MovieSummary } from "@netphim/tv-contracts";
import { MovieCard } from "./movie-card";

type MovieRailProps = {
  section: HomeSection;
  rowIndex: number;
  onSelect: (movie: MovieSummary) => void;
};

export function MovieRail({ section, rowIndex, onSelect }: MovieRailProps) {
  return (
    <section className="movie-rail" aria-labelledby={`section-${section.id}`}>
      <h2 id={`section-${section.id}`}>{section.title}</h2>
      <div className="movie-rail__track">
        {section.items.map((movie, columnIndex) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            focusId={`rail-${rowIndex}-${columnIndex}`}
            focusRow={rowIndex + 2}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
