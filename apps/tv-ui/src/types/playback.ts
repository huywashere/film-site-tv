export type TvEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  durationLabel: string;
  thumbnailUrl?: string;
  sourceUrl: string;
};

export type TvPlaybackItem = {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  year?: number;
  quality?: string;
  genres?: string[];
  description?: string;
  backdropUrl?: string;
  posterUrl: string;
  episodes: TvEpisode[];
};

export type TvPlayerOptions = {
  initialEpisodeIndex?: number;
  startPositionSeconds?: number;
};
