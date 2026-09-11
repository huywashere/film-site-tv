# ADR 0001: React and Vite for the shared TV interface

- Status: Accepted
- Date: 2026-09-08

## Context

The existing NetPhim website uses Next.js and server features. TV stores require static, signed application bundles and remote-first interaction. Samsung Tizen and LG webOS run web applications, while Android TV requires a platform shell and TV manifest.

## Decision

Build the shared TV interface with React, TypeScript, Vite, and native CSS. Keep platform packaging outside the UI package. Use a small in-house spatial-navigation core with deterministic unit tests before considering a larger focus dependency.

## Consequences

- The UI can be bundled as static assets for all initial platforms.
- Server-only Next.js behavior is not copied into the TV client.
- The TV repo has its own deployment lifecycle.
- API compatibility becomes an explicit product dependency.
- Platform capabilities are exposed through adapters instead of global conditionals.
