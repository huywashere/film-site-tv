import type { MovieSummary } from "@netphim/tv-contracts";
import { useRef, useState } from "react";
import { FeedError, FeedSkeleton } from "./components/feed-state";
import { Hero } from "./components/hero";
import { MovieRail } from "./components/movie-rail";
import { TvPlayer } from "./components/player/tv-player";
import { TopNavigation } from "./components/top-navigation";
import { resolvePlaybackItem } from "./data/playback-fixtures";
import { fetchRealPlaybackItem } from "./data/movie-provider";
import { useHomeFeed } from "./hooks/use-home-feed";
import { useRemoteNavigation } from "./hooks/use-remote-navigation";
import type { TvPlaybackItem } from "./types/playback";

export function App() {
  const feed = useHomeFeed();
  const [announcement, setAnnouncement] = useState("");
  const [playbackItem, setPlaybackItem] = useState<TvPlaybackItem | null>(null);
  const lastFocusIdRef = useRef<string | null>(null);
  const playbackSessionRef = useRef(0);

  const ready = feed.status !== "loading" && !playbackItem;
  useRemoteNavigation(ready);

  const announce = (message: string) => {
    setAnnouncement(`${message}. Tính năng đang được kết nối.`);
  };

  const startPlayback = async (movie: MovieSummary) => {
    const activeElement = document.activeElement as HTMLElement | null;
    lastFocusIdRef.current = activeElement?.dataset.focusId ?? null;
    const currentSession = ++playbackSessionRef.current;

    // 1. Initial responsive open
    const initial = resolvePlaybackItem(movie);
    setPlaybackItem(initial);

    // 2. Fetch real episodes and real m3u8 stream
    try {
      const realItem = await fetchRealPlaybackItem(movie);
      if (playbackSessionRef.current === currentSession) {
        setPlaybackItem(realItem);
      }
    } catch {
      // Keep initial stream
    }
  };

  const closePlayback = () => {
    playbackSessionRef.current = 0;
    setPlaybackItem(null);
    window.setTimeout(() => {
      if (lastFocusIdRef.current) {
        document
          .querySelector<HTMLElement>(
            `[data-focus-id="${CSS.escape(lastFocusIdRef.current)}"]`,
          )
          ?.focus();
      }
    }, 60);
  };

  if (feed.status === "loading") return <FeedSkeleton />;
  if (feed.status === "error") return <FeedError message={feed.message} />;

  return (
    <div className="tv-app">
      <TopNavigation onAction={announce} />
      <main>
        <Hero
          hero={feed.data.hero}
          onAction={announce}
          onPlay={() => startPlayback(feed.data.hero)}
        />
        <div className="rails">
          {feed.data.sections.map((section, index) => (
            <MovieRail
              key={section.id}
              section={section}
              rowIndex={index}
              onSelect={startPlayback}
            />
          ))}
        </div>
      </main>

      {/* Netflix-Grade Fullscreen TV Video Player */}
      {playbackItem && (
        <TvPlayer item={playbackItem} onClose={closePlayback} />
      )}

      {feed.source === "demo" && (
        <div className="demo-notice">Đang dùng dữ liệu giao diện cục bộ</div>
      )}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
