import { TvApiClient } from "@netphim/tv-api-client";
import type { TvHomePayload } from "@netphim/tv-contracts";
import { useEffect, useMemo, useState } from "react";
import { demoHome } from "../data/demo-home";
import { fetchRealTvHome } from "../data/movie-provider";

type FeedState =
  | { status: "loading" }
  | { status: "ready"; data: TvHomePayload; source: "api" | "demo" }
  | { status: "error"; message: string };

const toPositiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export function useHomeFeed() {
  const [state, setState] = useState<FeedState>({ status: "loading" });
  const allowDemoData = import.meta.env.VITE_ALLOW_DEMO_DATA !== "false";
  const client = useMemo(
    () =>
      new TvApiClient({
        baseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
        timeoutMs: toPositiveNumber(
          import.meta.env.VITE_REQUEST_TIMEOUT_MS,
          6_000,
        ),
      }),
    [],
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadFeed() {
      // 1. First attempt configured TV backend if baseUrl is set
      if (import.meta.env.VITE_API_BASE_URL) {
        try {
          const data = await client.getHome(controller.signal);
          if (active) setState({ status: "ready", data, source: "api" });
          return;
        } catch {
          // Continue to direct provider
        }
      }

      // 2. Fetch real movie catalog directly (matching Project_Movie_Site)
      try {
        const realData = await fetchRealTvHome();
        if (active) {
          setState({ status: "ready", data: realData, source: "api" });
          return;
        }
      } catch (error) {
        console.warn("Direct catalog fetch error, using local demo fallback:", error);
      }

      // 3. Fallback to local demo data for offline/test environments
      if (active) {
        if (allowDemoData) {
          setState({ status: "ready", data: demoHome, source: "demo" });
        } else {
          setState({
            status: "error",
            message: "Không thể tải dữ liệu TV lúc này.",
          });
        }
      }
    }

    loadFeed();

    return () => {
      active = false;
      controller.abort();
    };
  }, [allowDemoData, client]);

  return state;
}
