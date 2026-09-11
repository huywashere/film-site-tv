import type { HeroFeature } from "@netphim/tv-contracts";
import { Info, Play } from "@phosphor-icons/react";

type HeroProps = {
  hero: HeroFeature;
  onAction: (label: string) => void;
  onPlay?: () => void;
};

export function Hero({ hero, onAction, onPlay }: HeroProps) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img
        className="hero__image"
        src={hero.backdrop?.src ?? hero.poster.src}
        alt={hero.backdrop?.alt ?? hero.poster.alt}
        fetchPriority="high"
      />
      <div className="hero__veil" />
      <div className="hero__content">
        <h1 id="hero-title">{hero.title}</h1>
        {hero.originalTitle && <p className="hero__original">{hero.originalTitle}</p>}
        <div className="hero__metadata" aria-label="Thông tin phim">
          {hero.quality && <strong>{hero.quality}</strong>}
          {hero.year && <span>{hero.year}</span>}
          {hero.durationLabel && <span>{hero.durationLabel}</span>}
          {hero.genres.slice(0, 2).map((genre) => (
            <span key={genre}>{genre}</span>
          ))}
        </div>
        <p className="hero__description">{hero.description}</p>
        <div className="hero__actions">
          <button
            type="button"
            className="primary-button"
            data-tv-focusable="true"
            data-focus-id="hero-play"
            data-focus-row="1"
            onClick={() => {
              if (onPlay) {
                onPlay();
              } else {
                onAction(`Xem ${hero.title}`);
              }
            }}
          >
            <Play weight="fill" aria-hidden="true" />
            Xem ngay
          </button>
          <button
            type="button"
            className="secondary-button"
            data-tv-focusable="true"
            data-focus-id="hero-detail"
            data-focus-row="1"
            onClick={() => onAction(`Chi tiết ${hero.title}`)}
          >
            <Info weight="bold" aria-hidden="true" />
            Chi tiết
          </button>
        </div>
      </div>
    </section>
  );
}
