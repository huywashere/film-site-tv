export type ImageAsset = {
  src: string;
  alt: string;
  blurDataUrl?: string;
};

export type MovieSummary = {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  year?: number;
  quality?: string;
  progressPercent?: number;
  poster: ImageAsset;
  backdrop?: ImageAsset;
};

export type HeroFeature = MovieSummary & {
  description: string;
  durationLabel?: string;
  genres: string[];
};

export type HomeSection = {
  id: string;
  title: string;
  items: MovieSummary[];
};

export type TvHomePayload = {
  hero: HeroFeature;
  sections: HomeSection[];
  generatedAt: string;
};

export type PlaybackSource = {
  id: string;
  label: string;
  manifestUrl: string;
  mimeType: "application/vnd.apple.mpegurl";
  expiresAt?: string;
};

export type PlaybackSession = {
  sessionId: string;
  movieId: string;
  episodeId?: string;
  sources: PlaybackSource[];
};

export type ApiEnvelope<T> = {
  data: T;
  requestId?: string;
};
