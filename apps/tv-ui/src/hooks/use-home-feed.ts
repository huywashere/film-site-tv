import { TvApiClient } from "@netphim/tv-api-client";
import type { TvHomePayload } from "@netphim/tv-contracts";
import { useEffect, useMemo, useState } from "react";
import { demoHome } from "../data/demo-home";

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
    const controller = new AbortController();

    client
      .getHome(controller.signal)
      .then((data) => setState({ status: "ready", data, source: "api" }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (allowDemoData) {
          setState({ status: "ready", data: demoHome, source: "demo" });
          return;
        }
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Không thể tải dữ liệu TV lúc này.",
        });
      });

    return () => controller.abort();
  }, [allowDemoData, client]);

  return state;
}
