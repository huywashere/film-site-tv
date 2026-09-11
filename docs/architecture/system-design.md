# NetPhim TV system design

## Purpose

NetPhim TV is a remote-first client. It does not aggregate or normalize individual movie providers inside the device application. Catalog, deduplication, playback routing, user identity, and policy enforcement remain server responsibilities.

## Context

```text
Android TV        Samsung Tizen        LG webOS
     \                 |                  /
                 Cloudflare
                     |
                  TV BFF
          /          |            \
     Catalog       Identity       Playback
        |             |              |
  Meilisearch      PostgreSQL    Media Gateway
        \             |              /
                    Redis
```

## Client boundaries

- `tv-ui` owns presentation, remote focus, local view state, image lifecycle, and playback controls.
- `api-client` owns HTTP timeouts, authorization headers, request IDs, and typed responses.
- `focus-navigation` owns platform-neutral spatial ranking.
- Platform shells own lifecycle, network status, secure storage, remote key mapping, and packaging.
- The server owns canonical movie identity and provider fallback metadata.

## API principles

- TV clients consume `/api/v1/tv/*` only.
- Responses are backward-compatible inside a major API version.
- Home responses return precomposed sections to minimize TV CPU work.
- Playback URLs are short-lived and minted per playback session.
- Signed playback URLs are never persisted in application caches.
- Every response may include `x-request-id` for support correlation.

## Runtime flow

### Home

1. Shell launches the bundled application.
2. Client renders structural loading placeholders.
3. API client requests `/api/v1/tv/home` with a hard timeout.
4. TV BFF returns normalized, duplicate-free sections.
5. Images load only for the hero and visible rail window.

### Playback

1. User selects a movie or episode.
2. Client creates a playback session.
3. Media gateway evaluates source health and returns ordered manifests.
4. Player starts the first source and reports startup telemetry.
5. On recoverable network or provider failure, player requests a refreshed session before moving to the next source.

### Device authorization

1. TV requests a device code.
2. TV displays a QR code and short code.
3. User approves the device on an authenticated phone.
4. TV polls at the server-provided interval.
5. Refresh credentials are stored by the platform secure-storage adapter.

## Reliability targets

Initial targets must be validated on physical low-end TVs:

- D-pad response p95 below 100 ms.
- Home API p95 below 500 ms at the edge.
- Playback startup p95 below 4 seconds on a stable broadband connection.
- Playback start success above 98 percent.
- Crash-free sessions above 99.5 percent.

## Observability

The client emits bounded events without tokens or full playback URLs:

- `app_started`
- `home_ready`
- `focus_navigation_failed`
- `playback_requested`
- `playback_started`
- `playback_buffering`
- `playback_source_changed`
- `playback_failed`

Server dashboards correlate events with request ID, anonymous installation ID, app version, TV platform, and model family.

## Security baseline

- TLS is mandatory.
- Provider credentials and origins never ship in the client.
- Access tokens are short-lived.
- Refresh credentials use native secure storage when the platform provides it.
- Release artifacts are signed in CI with protected secrets.
- Dependency and secret scans block release builds.
- Logs redact authorization, cookies, device codes, and query strings containing signatures.

## Release topology

```text
pull request -> quality gate -> internal artifact -> device lab -> beta -> production
```

Each platform has an independent release channel. A failed Samsung review must not block an Android TV hotfix.
