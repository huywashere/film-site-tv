# NetPhim TV workspace rules

- Never push code unless the user explicitly requests it.
- TV interaction is remote-first. Every interactive element must be reachable by D-pad.
- Preserve a visible focus state and restore focus after navigation.
- Animate only transform and opacity. Honor prefers-reduced-motion.
- Keep the TV client independent from individual movie providers. Use the versioned NetPhim API contract.
- Never commit signing certificates, API secrets, playback tokens, APKs, AABs, WGTs, or IPKs.
- Validate long-running playback on physical devices before calling a release stable.

## Video Playback Guidelines (Netflix-Grade TV Standard)
- Playback controls must be remote-first:
  - `Enter / Space`: Toggle Play/Pause with center visual pulse indicator.
  - `ArrowLeft / ArrowRight`: Seek 10s with scrub preview tooltip; hold to fast seek.
  - `ArrowUp / ArrowDown`: Toggle OSD HUD or open Episodes Drawer.
  - `Escape / Back`: Close active dialogs (PIP, Drawer) or exit player and restore focus to the catalog.
- HLS Engine Tuning: Enforce `maxBufferLength: 30`, `maxMaxBufferLength: 60`, and `startFragPrefetch: true` for zero-stall playback on TV networks.
- Next Episode Transitions: Display seamless PIP countdown card during credits window (last 35s) with automatic advance.
- Zero Push Rule: Never push code to Git without explicit user confirmation.

