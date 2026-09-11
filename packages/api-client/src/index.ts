import type {
  ApiEnvelope,
  PlaybackSession,
  TvHomePayload,
} from "@netphim/tv-contracts";

export type TvApiClientOptions = {
  baseUrl: string;
  timeoutMs?: number;
  getAccessToken?: () => string | undefined;
  fetchImpl?: typeof fetch;
};

export class TvApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "TvApiError";
  }
}

export class TvApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly getAccessToken?: () => string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TvApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 6_000;
    this.getAccessToken = options.getAccessToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  getHome(signal?: AbortSignal) {
    return this.request<TvHomePayload>("/api/v1/tv/home", { signal });
  }

  createPlaybackSession(
    input: { movieId: string; episodeId?: string },
    signal?: AbortSignal,
  ) {
    return this.request<PlaybackSession>("/api/v1/tv/playback/session", {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.baseUrl) {
      throw new TvApiError("TV API base URL is not configured");
    }

    const timeoutController = new AbortController();
    const timeoutId = window.setTimeout(
      () => timeoutController.abort("request-timeout"),
      this.timeoutMs,
    );
    const combinedSignal = init.signal
      ? AbortSignal.any([init.signal, timeoutController.signal])
      : timeoutController.signal;
    const token = this.getAccessToken?.();

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: combinedSignal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
      const requestId = response.headers.get("x-request-id") ?? undefined;

      if (!response.ok) {
        throw new TvApiError(
          `TV API request failed with status ${response.status}`,
          response.status,
          requestId,
        );
      }

      const payload = (await response.json()) as ApiEnvelope<T>;
      return payload.data;
    } catch (error) {
      if (error instanceof TvApiError) throw error;
      if (timeoutController.signal.aborted) {
        throw new TvApiError("TV API request timed out");
      }
      throw new TvApiError(
        error instanceof Error ? error.message : "Unknown TV API error",
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}
