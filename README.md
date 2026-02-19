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
- `--rotate-fingerprint`    Rotate persona selection (persistent round-robin across runs)
- `--fingerprint <id>`      Alias for `--persona` to set a specific fingerprint/persona
- `--provider-dryRun`       Run provider steps in simulation mode even if other steps may call network
- `--stealth-disable <list>` Disable specific stealth shims (comma-separated). Valid values include: `canvas`, `toString`, `fonts`, `audio`, `webgl`, `connection`, `screen`, `plugins`, `languages`, `mediaDevices`.

New: Deeper stealth
- Added canvas-noise, `Function.prototype.toString` masking, font enumeration stubs and audio fingerprint mitigations. These are optional shims applied by `browser/stealth.js` and are intended for defensive, testable anti-fingerprinting only.

New: Personas & Stealth

Stealth presets
- `--stealth-preset <name>` — convenience presets that set `--stealth` and `--stealth-disable` together.
- Available presets:
  - `full` (default) — all shims enabled
  - `lite` — minimal shims
  - `privacy` — equivalent to `full` (named preset for clarity)
  - `compat` — `lite` + disables `canvas` and `toString` for compatibility with strict sites

Examples
- Use a preset: `node core/cli.js --stealth-preset compat --dryRun`
- Override a preset: `node core/cli.js --stealth-preset compat --stealth full --dryRun` (explicit flags take precedence)

LLM integration (local)
- `--llm ollama` will instruct the agent to use a local Ollama instance when available.
- Use `--dryRun` in tests/CI to avoid calling the local LLM.
- Ollama URL can be set with `OLLAMA_URL` environment variable (default: `http://127.0.0.1:11434`).

LangGraph example (local)
- Run a LangGraph-style flow (demo):
  `node core/cli.js --flow "audit user session" --llm ollama --dryRun`

- Extended flow (web-scraper + validator):
  `node core/cli.js --flow "audit user session" --flow-extended --dryRun --provider-dryRun --require example`

- Selector options for the web-scraper node:
  - `selector: "css:<selector>"` — extract text using CSS selectors (uses cheerio for HTML parsing)
  - `selector: "json:<path>"` — extract value from parsed JSON using dot-path (e.g. `json:user.id`)

- Example e2e (requires Ollama): see `examples/langgraph-e2e.md` for steps and test guidance.

- Or call the agent directly in code: `startLangGraphMode({ flow: 'do X', llm: 'ollama', dryRun: true, extended: true })`

Examples
- Run agent with local Ollama (dry-run):
  `node core/cli.js --agent "summarize this" --llm ollama --dryRun`


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

