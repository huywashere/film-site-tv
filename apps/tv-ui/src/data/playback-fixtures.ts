import type { HeroFeature, MovieSummary } from "@netphim/tv-contracts";
import type { TvPlaybackItem } from "../types/playback";

// High-reliability multi-bitrate HLS streams for TV testing
const DEFAULT_HLS_STREAM =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export function resolvePlaybackItem(
  item: MovieSummary | HeroFeature,
): TvPlaybackItem {
  const isHero = "description" in item;
  const description = isHero
    ? (item as HeroFeature).description
    : "Một hành trình điện ảnh kỳ thú với chất lượng âm thanh và hình ảnh sống động nhất.";
  const genres = isHero ? (item as HeroFeature).genres : ["Kịch tính", "Phiêu lưu"];

  // Generate 4 episodes for TV episodic testing
  const episodes = [
    {
      id: `${item.id}-ep-1`,
      episodeNumber: 1,
      title: "Tập 1: Khởi đầu mới",
      durationLabel: "45 phút",
      thumbnailUrl: item.backdrop?.src ?? item.poster.src,
      sourceUrl: DEFAULT_HLS_STREAM,
    },
    {
      id: `${item.id}-ep-2`,
      episodeNumber: 2,
      title: "Tập 2: Dấu vết bí ẩn",
      durationLabel: "48 phút",
      thumbnailUrl: item.backdrop?.src ?? item.poster.src,
      sourceUrl: DEFAULT_HLS_STREAM,
    },
    {
      id: `${item.id}-ep-3`,
      episodeNumber: 3,
      title: "Tập 3: Ranh giới sinh tử",
      durationLabel: "52 phút",
      thumbnailUrl: item.backdrop?.src ?? item.poster.src,
      sourceUrl: DEFAULT_HLS_STREAM,
    },
    {
      id: `${item.id}-ep-4`,
      episodeNumber: 4,
      title: "Tập 4: Sự thật hé lộ",
      durationLabel: "50 phút",
      thumbnailUrl: item.backdrop?.src ?? item.poster.src,
      sourceUrl: DEFAULT_HLS_STREAM,
    },
  ];

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    originalTitle: item.originalTitle,
    year: item.year ?? 2026,
    quality: item.quality ?? "4K HDR",
    genres,
    description,
    backdropUrl: item.backdrop?.src ?? item.poster.src,
    posterUrl: item.poster.src,
    episodes,
  };
}
