import type { HeroFeature, HomeSection, MovieSummary, TvHomePayload } from "@netphim/tv-contracts";
import type { TvEpisode, TvPlaybackItem } from "../types/playback";

const KKPHIM_API = "https://phimapi.com";
const KKPHIM_CDN = "https://phimimg.com";

// Helper: Ensure full image URL
const formatImageUrl = (url?: string): string => {
  if (!url) return "/artwork/netphim-tv-hero.webp";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${KKPHIM_CDN}/${url.replace(/^\/+/, "")}`;
};

// Helper: Map raw KKPhim item to MovieSummary
interface RawKKMovie {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  origin_name?: string;
  year?: number;
  quality?: string;
  thumb_url?: string;
  poster_url?: string;
  content?: string;
  time?: string;
  category?: Array<{ name: string }>;
}

const mapRawToSummary = (raw: RawKKMovie): MovieSummary => {
  const posterUrl = formatImageUrl(raw.poster_url || raw.thumb_url);
  const backdropUrl = formatImageUrl(raw.thumb_url || raw.poster_url);

  return {
    id: raw.slug || raw._id || String(Math.random()),
    slug: raw.slug || "",
    title: raw.name || "Chưa có tên",
    originalTitle: raw.origin_name,
    year: raw.year || 2026,
    quality: raw.quality || "FHD",
    poster: {
      src: posterUrl,
      alt: raw.name || "Áp phích phim",
    },
    backdrop: {
      src: backdropUrl,
      alt: raw.name || "Hình nền phim",
    },
  };
};

// Fetch real Home feed from KKPhim
export async function fetchRealTvHome(): Promise<TvHomePayload> {
  const [latestRes, seriesRes, singleRes, animeRes] = await Promise.allSettled([
    fetch(`${KKPHIM_API}/danh-sach/phim-moi-cap-nhat?page=1`).then((r) => r.json()),
    fetch(`${KKPHIM_API}/v1/api/danh-sach/phim-bo?page=1&limit=16`).then((r) => r.json()),
    fetch(`${KKPHIM_API}/v1/api/danh-sach/phim-le?page=1&limit=16`).then((r) => r.json()),
    fetch(`${KKPHIM_API}/v1/api/danh-sach/hoat-hinh?page=1&limit=16`).then((r) => r.json()),
  ]);

  const latestItems: RawKKMovie[] =
    latestRes.status === "fulfilled" ? latestRes.value?.items || [] : [];
  const seriesItems: RawKKMovie[] =
    seriesRes.status === "fulfilled"
      ? seriesRes.value?.data?.items || seriesRes.value?.items || []
      : [];
  const singleItems: RawKKMovie[] =
    singleRes.status === "fulfilled"
      ? singleRes.value?.data?.items || singleRes.value?.items || []
      : [];
  const animeItems: RawKKMovie[] =
    animeRes.status === "fulfilled"
      ? animeRes.value?.data?.items || animeRes.value?.items || []
      : [];

  // Choose top item for Hero Banner
  const heroRaw: RawKKMovie =
    seriesItems[0] || latestItems[0] || singleItems[0] || {};
  const heroSummary = mapRawToSummary(heroRaw);

  const hero: HeroFeature = {
    ...heroSummary,
    description:
      heroRaw?.content?.replace(/<[^>]*>?/gm, "").trim() ||
      "Bộ phim thịnh hành đang được theo dõi nhiều nhất trên hệ thống NetPhim TV.",
    durationLabel: heroRaw?.time || "Tập mới",
    genres: heroRaw?.category?.map((c) => c.name) || ["Hành động", "Kịch tính"],
  };

  const sections: HomeSection[] = [
    {
      id: "latest",
      title: "Phim mới cập nhật",
      items: latestItems.slice(0, 14).map(mapRawToSummary),
    },
    {
      id: "series",
      title: "Phim bộ thịnh hành",
      items: seriesItems.slice(0, 14).map(mapRawToSummary),
    },
    {
      id: "single",
      title: "Phim lẻ đặc sắc",
      items: singleItems.slice(0, 14).map(mapRawToSummary),
    },
    {
      id: "anime",
      title: "Anime & Hoạt hình",
      items: animeItems.slice(0, 14).map(mapRawToSummary),
    },
  ];

  return {
    hero,
    sections: sections.filter((s) => s.items.length > 0),
    generatedAt: new Date().toISOString(),
  };
}

// Fetch real movie detail & real M3U8 streaming links
export async function fetchRealPlaybackItem(
  movie: MovieSummary | HeroFeature,
): Promise<TvPlaybackItem> {
  try {
    const res = await fetch(`${KKPHIM_API}/phim/${encodeURIComponent(movie.slug)}`);
    if (!res.ok) throw new Error(`Movie detail error: ${res.status}`);

    const data = await res.json();
    const item = data.movie || data.data?.item;
    const episodesData = data.episodes || data.data?.item?.episodes || [];

    const rawEpisodes: Array<{ name: string; slug: string; link_m3u8: string }> =
      episodesData[0]?.server_data || [];

    const episodes: TvEpisode[] = rawEpisodes
      .filter((ep) => Boolean(ep.link_m3u8))
      .map((ep, index) => ({
        id: `${movie.slug}-${ep.slug || index}`,
        episodeNumber: index + 1,
        title: ep.name.includes("Tập") ? ep.name : `Tập ${ep.name}`,
        durationLabel: item?.time || "45 phút",
        thumbnailUrl: formatImageUrl(item?.thumb_url || movie.backdrop?.src || movie.poster.src),
        sourceUrl: ep.link_m3u8,
      }));

    if (episodes.length > 0) {
      return {
        id: movie.id,
        slug: movie.slug,
        title: item?.name || movie.title,
        originalTitle: item?.origin_name || movie.originalTitle,
        year: item?.year || movie.year || 2026,
        quality: item?.quality || movie.quality || "FHD",
        genres: item?.category?.map((c: { name: string }) => c.name) || ["Điện ảnh"],
        description:
          item?.content?.replace(/<[^>]*>?/gm, "").trim() ||
          ("description" in movie ? (movie as HeroFeature).description : "Đang phát phim..."),
        backdropUrl: formatImageUrl(item?.thumb_url || movie.backdrop?.src),
        posterUrl: formatImageUrl(item?.poster_url || movie.poster.src),
        episodes,
      };
    }
  } catch (error) {
    console.warn("Falling back to fixture playback:", error);
  }

  // Graceful fallback to fixture stream if provider is unreachable
  const fallbackStream = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
  return {
    id: movie.id,
    slug: movie.slug,
    title: movie.title,
    originalTitle: movie.originalTitle,
    year: movie.year || 2026,
    quality: movie.quality || "4K HDR",
    genres: "genres" in movie ? (movie as HeroFeature).genres : ["Kịch tính"],
    description: "description" in movie ? (movie as HeroFeature).description : "",
    backdropUrl: movie.backdrop?.src ?? movie.poster.src,
    posterUrl: movie.poster.src,
    episodes: [
      {
        id: `${movie.id}-ep-1`,
        episodeNumber: 1,
        title: "Tập 1: Khởi đầu mới",
        durationLabel: "45 phút",
        thumbnailUrl: movie.backdrop?.src ?? movie.poster.src,
        sourceUrl: fallbackStream,
      },
    ],
  };
}
