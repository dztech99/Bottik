# Bottik (Bottok-AI fork)
Automated, powerful app for TikTok — modular skeleton for Bottok-AI (Playwright + local agent)

## Quick start
- Install: `npm install`
- Install Playwright browsers: `npx playwright install --with-deps`
- Run tests: `npm test`

See `ROADMAP.md` for the Phase‑1 plan.

## CLI usage

The CLI supports three primary modes: `agent`, `human` (direct), and the `indirect` provider mode.

Flags
- `--agent`                 Run the local agent demo (SQLite-backed).
- `--human` / `--mode direct`  Launch Playwright human-simulator.
- `--persona <id>`          Select a persona from `config/personas.js` (e.g. `mobile_safari_iphone`).
- `--proxy-file <path>`     Load proxies from a newline-separated file (format: `[user:pass@]host:port`).
- `--visible`               Launch browser in visible (non-headless) mode.
- `--dryRun`                Run provider in dry-run mode (no browser launched) — useful for CI/tests.
- `--no-jitter`             Disable session fingerprint jitter (useful for deterministic runs/tests)

New: Personas & Stealth
- Several additional personas were added (desktop_firefox_windows, android_pixel_6, ipad_safari_landscape).
- `browser/stealth.js` now applies additional anti-fingerprinting shims: `navigator.deviceMemory`, `navigator.hardwareConcurrency`, `navigator.plugins`/`mimeTypes`, WebGL vendor spoofing and a basic `navigator.permissions` shim.
- To add or tune personas, edit `config/personas.js` — set `hardwareConcurrency` and `deviceMemory` for more realistic fingerprints.

Examples
- Dry-run provider with persona:
  `node core/cli.js --persona mobile_safari_iphone --dryRun`

- Run human simulator with a proxy file (visible browser):
  `node core/cli.js --human --proxy-file ./proxies.txt --visible`

Notes
- The `providers/indirect.js` file contains a Playwright-compatible provider implementation (safe reimplementation). If you need an exact port of the original provider, provide the original source and I will port it into the adapter.
- Tests include CI-friendly `dryRun` paths so Playwright browsers are not required for all tests.

