# Changelog

## v2.1.0 — 2026-02-19

### Added
- Agentic pipeline orchestrator (`--agentic`) with fixed stages: analyzer → web-scraper → validator → simulator → reporter.
- Executor layer (`agents/langgraph-executors.js`) to delegate per-role work (enables future remote agents/workers).
- `web-scraper` selector enhancements: `css:<selector>`, `css:<selector>@attr`, `json:<dot.path>`, `jsonpath:<expr>`.
- Background rotators: `ProxyRotator` health monitor and `FingerprintRotator` persona rotation.
- New unit tests covering orchestrator, CSS & JSONPath selectors, and executor refactor.

### Changed
- Refactored `executeLangGraph` to use centralized executor workers.
- Updated README with selector examples and orchestrator CLI flag.

### Fixed
- Selector handling edge-cases and safer inline payload parsing for tests/dry-run.

### Notes
- Lint warnings pre-existed; will be addressed in a separate cleanup PR.

---
