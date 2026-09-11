import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowLeft,
  FastForward,
  Pause,
  Play,
  Queue,
  Subtitles,
} from "@phosphor-icons/react";
import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TvPlaybackItem } from "../../types/playback";

type TvPlayerProps = {
  item: TvPlaybackItem;
  initialEpisodeIndex?: number;
  onClose: () => void;
};

const OSD_TIMEOUT_MS = 4000;
const SKIP_INTRO_TARGET_SEC = 90;

export function TvPlayer({ item, initialEpisodeIndex = 0, onClose }: TvPlayerProps) {
  const [currentEpIndex, setCurrentEpIndex] = useState(initialEpisodeIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isOsdVisible, setIsOsdVisible] = useState(true);
  const [centerPulse, setCenterPulse] = useState<"play" | "pause" | null>(null);
  const [seekFeedback, setSeekFeedback] = useState<{
    direction: "forward" | "rewind";
    time: number;
    seconds: number;
  } | null>(null);
  const [showNextPip, setShowNextPip] = useState(false);
  const [pipCountdown, setPipCountdown] = useState(10);
  const [showDrawer, setShowDrawer] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const osdTimerRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<number | null>(null);
  const seekTimerRef = useRef<number | null>(null);
  const pipTimerRef = useRef<number | null>(null);
  const pipDismissedRef = useRef(false);

  const currentEpisode = item.episodes[currentEpIndex] ?? item.episodes[0];
  const nextEpisode = item.episodes[currentEpIndex + 1];

  // Helper: Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return "00:00";
    const total = Math.floor(secs);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Show OSD briefly and auto-schedule hide
  const triggerOsd = useCallback(() => {
    setIsOsdVisible(true);
    if (osdTimerRef.current) window.clearTimeout(osdTimerRef.current);
    osdTimerRef.current = window.setTimeout(() => {
      setIsOsdVisible(false);
    }, OSD_TIMEOUT_MS);
  }, []);

  // Initialize HLS Stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentEpisode?.sourceUrl) return;

    setIsBuffering(true);
    setCurrentTime(0);
    pipDismissedRef.current = false;
    setShowNextPip(false);
    setPipCountdown(10);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        startFragPrefetch: true,
        progressive: true,
        lowLatencyMode: false,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.85,
        backBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.loadSource(currentEpisode.sourceUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentEpisode.sourceUrl;
      video.play().catch(() => setIsPlaying(false));
    }

    triggerOsd();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentEpisode, triggerOsd]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      triggerOsd();
    };
    const onPause = () => {
      setIsPlaying(false);
      setIsOsdVisible(true);
      if (osdTimerRef.current) window.clearTimeout(osdTimerRef.current);
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onDurationChange = () => setDuration(video.duration);

    const onTimeUpdate = () => {
      const cur = video.currentTime;
      const dur = video.duration;
      setCurrentTime(cur);

      // Buffer percentage calculation
      if (video.buffered.length > 0 && dur > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= cur && cur <= video.buffered.end(i)) {
            setBufferedPercent((video.buffered.end(i) / dur) * 100);
            break;
          }
        }
      }

      // Next Episode PIP Trigger (last 35s of video)
      if (
        nextEpisode &&
        dur > 60 &&
        dur - cur <= 35 &&
        !pipDismissedRef.current &&
        !showNextPip
      ) {
        setShowNextPip(true);
      }
    };

    const onEnded = () => {
      if (nextEpisode) {
        setCurrentEpIndex((prev) => prev + 1);
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [nextEpisode, showNextPip, triggerOsd]);

  // PIP Countdown timer
  useEffect(() => {
    if (!showNextPip) return;

    pipTimerRef.current = window.setInterval(() => {
      setPipCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(pipTimerRef.current!);
          if (nextEpisode) {
            setCurrentEpIndex((ep) => ep + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (pipTimerRef.current) window.clearInterval(pipTimerRef.current);
    };
  }, [showNextPip, nextEpisode]);

  // Action: Toggle Play / Pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setCenterPulse("play");
    } else {
      video.pause();
      setCenterPulse("pause");
    }

    if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = window.setTimeout(() => {
      setCenterPulse(null);
    }, 600);

    triggerOsd();
  }, [triggerOsd]);

  // Action: Seek relative seconds
  const seekRelative = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
      video.currentTime = newTime;
      setCurrentTime(newTime);

      setSeekFeedback({
        direction: seconds > 0 ? "forward" : "rewind",
        time: newTime,
        seconds: Math.abs(seconds),
      });

      if (seekTimerRef.current) window.clearTimeout(seekTimerRef.current);
      seekTimerRef.current = window.setTimeout(() => {
        setSeekFeedback(null);
      }, 900);

      triggerOsd();
    },
    [triggerOsd],
  );

  // Action: Skip Intro
  const skipIntro = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = SKIP_INTRO_TARGET_SEC;
    setCurrentTime(SKIP_INTRO_TARGET_SEC);
    triggerOsd();
  }, [triggerOsd]);

  // Action: Switch episode
  const selectEpisode = useCallback((index: number) => {
    setCurrentEpIndex(index);
    setShowDrawer(false);
  }, []);

  // TV Remote Keydown Handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      // Handle Back / Escape
      if (
        key === "Escape" ||
        key === "Backspace" ||
        key === "BrowserBack" ||
        event.keyCode === 10009 ||
        event.keyCode === 461
      ) {
        event.preventDefault();
        event.stopPropagation();
        if (showDrawer) {
          setShowDrawer(false);
          return;
        }
        if (showNextPip) {
          setShowNextPip(false);
          pipDismissedRef.current = true;
          return;
        }
        onClose();
        return;
      }

      // Handle Enter / Space
      if (key === "Enter" || key === " " || key === "Select" || event.keyCode === 13) {
        const active = document.activeElement as HTMLElement | null;
        // If a button inside player is focused, let normal click fire
        if (active && active.dataset.tvFocusable === "true" && active.tagName === "BUTTON") {
          return;
        }
        // Otherwise toggle play/pause
        event.preventDefault();
        event.stopPropagation();
        togglePlay();
        return;
      }

      // Handle Arrow Up
      if (key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        if (showDrawer) return;
        if (!isOsdVisible) {
          triggerOsd();
          document.querySelector<HTMLElement>("[data-focus-id='player-play']")?.focus();
        } else {
          document.querySelector<HTMLElement>("[data-focus-id='player-back']")?.focus();
        }
        return;
      }

      // Handle Arrow Down
      if (key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        if (showDrawer) return;
        if (!isOsdVisible) {
          triggerOsd();
          document.querySelector<HTMLElement>("[data-focus-id='player-play']")?.focus();
        } else {
          document.querySelector<HTMLElement>("[data-focus-id='player-episodes']")?.focus();
        }
        return;
      }

      // Handle Arrow Left (Rewind 10s or navigate)
      if (key === "ArrowLeft") {
        const active = document.activeElement as HTMLElement | null;
        if (showDrawer) return;
        if (isOsdVisible && active && active.dataset.tvFocusable === "true") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        seekRelative(-10);
        return;
      }

      // Handle Arrow Right (Forward 10s or navigate)
      if (key === "ArrowRight") {
        const active = document.activeElement as HTMLElement | null;
        if (showDrawer) return;
        if (isOsdVisible && active && active.dataset.tvFocusable === "true") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        seekRelative(10);
        return;
      }

      // Media Keys
      if (key === "MediaPlayPause") {
        event.preventDefault();
        togglePlay();
      } else if (key === "MediaPlay") {
        event.preventDefault();
        videoRef.current?.play();
      } else if (key === "MediaPause") {
        event.preventDefault();
        videoRef.current?.pause();
      } else if (key === "MediaFastForward") {
        event.preventDefault();
        seekRelative(10);
      } else if (key === "MediaRewind") {
        event.preventDefault();
        seekRelative(-10);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [
    isOsdVisible,
    showDrawer,
    showNextPip,
    onClose,
    togglePlay,
    seekRelative,
    triggerOsd,
  ]);

  // Focus drawer active item when drawer opens
  useEffect(() => {
    if (showDrawer) {
      window.setTimeout(() => {
        document
          .querySelector<HTMLElement>(`[data-focus-id='drawer-ep-${currentEpIndex}']`)
          ?.focus();
      }, 50);
    }
  }, [showDrawer, currentEpIndex]);

  // Focus PIP card play button when PIP card opens
  useEffect(() => {
    if (showNextPip) {
      window.setTimeout(() => {
        document.querySelector<HTMLElement>("[data-focus-id='pip-play-btn']")?.focus();
      }, 50);
    }
  }, [showNextPip]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const canSkipIntro = currentTime >= 5 && currentTime < SKIP_INTRO_TARGET_SEC;

  return (
    <div className="tv-player" role="region" aria-label="Trình phát video NetPhim TV">
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        className="tv-player__video"
        playsInline
        onClick={togglePlay}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="tv-player__buffering" aria-live="polite">
          <div className="tv-player__spinner" />
          <span className="tv-player__buffering-text">Đang tải luồng phát...</span>
        </div>
      )}

      {/* Center Pulse Play/Pause Feedback */}
      {centerPulse && (
        <div className="tv-player__center-pulse" aria-hidden="true">
          {centerPulse === "play" ? (
            <Play weight="fill" />
          ) : (
            <Pause weight="fill" />
          )}
        </div>
      )}

      {/* Seek Scrub Tooltip */}
      {seekFeedback && (
        <div className="tv-player__seek-tooltip" aria-hidden="true">
          {seekFeedback.direction === "forward" ? (
            <ArrowClockwise weight="bold" />
          ) : (
            <ArrowCounterClockwise weight="bold" />
          )}
          <span>
            {seekFeedback.direction === "forward" ? "+10s" : "-10s"} • {formatTime(seekFeedback.time)}
          </span>
        </div>
      )}

      {/* OSD (On-Screen Display) */}
      <div
        className={`tv-player__osd ${isOsdVisible ? "tv-player__osd--visible" : ""}`}
        onClick={triggerOsd}
      >
        {/* Top Header */}
        <header className="tv-player__header">
          <button
            type="button"
            className="tv-player__back-btn"
            aria-label="Thoát trình phát"
            data-tv-focusable="true"
            data-focus-id="player-back"
            data-focus-row="0"
            onClick={onClose}
          >
            <ArrowLeft weight="bold" />
          </button>
          <div className="tv-player__meta">
            <div className="tv-player__title-row">
              <h1 className="tv-player__movie-title">{item.title}</h1>
              {item.quality && (
                <span className="tv-player__badge">{item.quality}</span>
              )}
              <span className="tv-player__badge">5.1</span>
              <span className="tv-player__badge">Vietsub</span>
            </div>
            <p className="tv-player__episode-title">
              {currentEpisode?.title ?? item.originalTitle}
            </p>
          </div>
        </header>

        {/* Bottom Controls */}
        <footer className="tv-player__footer">
          {/* Progress Bar */}
          <div className="tv-player__progress-container">
            <div
              className="tv-player__progress-bar"
              role="slider"
              aria-label="Tiến độ phát"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              data-tv-focusable="true"
              data-focus-id="player-progress"
              data-focus-row="1"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPos = (e.clientX - rect.left) / rect.width;
                if (videoRef.current && duration > 0) {
                  videoRef.current.currentTime = clickPos * duration;
                }
              }}
            >
              <div
                className="tv-player__progress-buffer"
                style={{ width: `${bufferedPercent}%` }}
              />
              <div
                className="tv-player__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="tv-player__time-row">
              <span className="tv-player__time-current">{formatTime(currentTime)}</span>
              <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="tv-player__controls">
            <div className="tv-player__controls-left">
              {/* Play / Pause */}
              <button
                type="button"
                className="tv-player__btn tv-player__btn--icon"
                aria-label={isPlaying ? "Tạm dừng" : "Phát tiếp"}
                data-tv-focusable="true"
                data-focus-id="player-play"
                data-focus-row="2"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}
              </button>

              {/* Rewind 10s */}
              <button
                type="button"
                className="tv-player__btn tv-player__btn--icon"
                aria-label="Lùi 10 giây"
                data-tv-focusable="true"
                data-focus-id="player-rewind"
                data-focus-row="2"
                onClick={() => seekRelative(-10)}
              >
                <ArrowCounterClockwise weight="bold" />
              </button>

              {/* Forward 10s */}
              <button
                type="button"
                className="tv-player__btn tv-player__btn--icon"
                aria-label="Tiến 10 giây"
                data-tv-focusable="true"
                data-focus-id="player-forward"
                data-focus-row="2"
                onClick={() => seekRelative(10)}
              >
                <ArrowClockwise weight="bold" />
              </button>

              {/* Episodes Drawer Button */}
              {item.episodes.length > 1 && (
                <button
                  type="button"
                  className="tv-player__btn"
                  data-tv-focusable="true"
                  data-focus-id="player-episodes"
                  data-focus-row="2"
                  onClick={() => setShowDrawer(true)}
                >
                  <Queue weight="bold" />
                  <span>Tập phim ({currentEpIndex + 1}/{item.episodes.length})</span>
                </button>
              )}

              {/* Subtitles & Audio */}
              <button
                type="button"
                className="tv-player__btn"
                data-tv-focusable="true"
                data-focus-id="player-audio"
                data-focus-row="2"
                onClick={() => triggerOsd()}
              >
                <Subtitles weight="bold" />
                <span>Âm thanh & Phụ đề</span>
              </button>
            </div>

            <div className="tv-player__controls-right">
              {/* Skip Intro */}
              {canSkipIntro && (
                <button
                  type="button"
                  className="tv-player__btn tv-player__skip-btn"
                  data-tv-focusable="true"
                  data-focus-id="player-skip-intro"
                  data-focus-row="2"
                  onClick={skipIntro}
                >
                  <FastForward weight="bold" />
                  <span>Bỏ qua giới thiệu</span>
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* Next Episode PIP Countdown Card */}
      {showNextPip && nextEpisode && (
        <div className="tv-player__next-pip" role="dialog" aria-label="Tập tiếp theo">
          <div className="tv-player__next-pip-header">
            <span className="tv-player__next-pip-tag">Tập tiếp theo</span>
            <span className="tv-player__next-pip-timer">{pipCountdown}s</span>
          </div>
          <h2 className="tv-player__next-pip-title">{nextEpisode.title}</h2>
          <div className="tv-player__next-pip-actions">
            <button
              type="button"
              className="tv-player__pip-btn-play"
              data-tv-focusable="true"
              data-focus-id="pip-play-btn"
              data-focus-row="3"
              onClick={() => {
                setShowNextPip(false);
                setCurrentEpIndex((prev) => prev + 1);
              }}
            >
              <Play weight="fill" />
              <span>Xem ngay</span>
            </button>
            <button
              type="button"
              className="tv-player__pip-btn-dismiss"
              data-tv-focusable="true"
              data-focus-id="pip-dismiss-btn"
              data-focus-row="3"
              onClick={() => {
                setShowNextPip(false);
                pipDismissedRef.current = true;
              }}
            >
              <span>Hủy</span>
            </button>
          </div>
        </div>
      )}

      {/* Episodes Selector Drawer */}
      {showDrawer && (
        <>
          <div
            className="tv-player__drawer-backdrop"
            onClick={() => setShowDrawer(false)}
          />
          <div className="tv-player__drawer" role="dialog" aria-label="Danh sách tập">
            <div className="tv-player__drawer-header">
              <h2 className="tv-player__drawer-title">Danh sách tập</h2>
              <span className="tv-player__drawer-hint">Nhấn Trái/Phải để chọn tập • Back để đóng</span>
            </div>
            <div className="tv-player__drawer-rail">
              {item.episodes.map((ep, idx) => {
                const isActive = idx === currentEpIndex;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    className={`tv-player__episode-card ${
                      isActive ? "tv-player__episode-card--active" : ""
                    }`}
                    data-tv-focusable="true"
                    data-focus-id={`drawer-ep-${idx}`}
                    data-focus-row="4"
                    onClick={() => selectEpisode(idx)}
                  >
                    <div className="tv-player__ep-thumb">
                      <img
                        src={ep.thumbnailUrl ?? item.posterUrl}
                        alt={ep.title}
                        loading="lazy"
                      />
                      {isActive && (
                        <span className="tv-player__ep-active-badge">Đang phát</span>
                      )}
                    </div>
                    <div className="tv-player__ep-meta">
                      <span className="tv-player__ep-name">{ep.title}</span>
                      <span className="tv-player__ep-duration">{ep.durationLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
