# News Inbox

Auto-collected inbox of news, upstream updates, security fixes, and ideas relevant to this repo, appended daily by News Bot.
A Cursor planning agent should review these items and fold the useful ones into BUILD_PLAN; entries are append-only, newest at the bottom.


## 2026-11-13

**News and updates**

- Modern Web Guidance 1.0 from Chrome, Edge, Firefox and MDN: an official coding-agent skill plus `legacy-scan` that flags legacy JS/CSS. [source](https://github.com/GoogleChrome/modern-web-guidance/releases/tag/v1.0.0)
- Android Developers case study: SmileID used CameraX to handle OEM orientation quirks, aspect stretching and OOM across 18,000+ devices. [source](https://developer.android.com/blog/posts/smileid-camerax-android-identity-verification)

**Tasks for the planning agent**

- [ ] Run Modern Web Guidance legacy-scan on the PWA — Flags legacy JS/CSS with native replacements. Label: `[AGENT][LOCAL]` · Priority: P3 · https://github.com/GoogleChrome/modern-web-guidance/releases/tag/v1.0.0
- [ ] Use CameraX fragmentation findings in device camera notes — Real-world OEM camera quirks enrich the camera-first guide. Label: `[AGENT][LOCAL]` · Priority: P3 · https://developer.android.com/blog/posts/smileid-camerax-android-identity-verification
