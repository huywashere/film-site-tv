# Android TV platform shell

This is the first release target. The shell will own:

- Leanback launcher declaration and TV banner
- WebView lifecycle and remote key bridge
- Network status
- Secure token storage
- Media session integration
- Signed AAB and internal APK builds

The shell must load bundled `tv-ui` assets. A production release must not depend on a remotely hosted application shell.
