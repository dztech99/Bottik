# Pending issues (auto-generated task list)

Below are suggested GitHub issues to create from remaining roadmap items and follow-ups. I can open these issues if you provide GH auth, otherwise they're tracked here.

- Title: Port original Bottok provider into `providers/indirect.js`
  - Body: Port and adapt the original `bottok.js` provider logic (Puppeteer/captcha/cloudflare handling) into `providers/indirect.js`. Ensure licensing and attribution are correct.

- Title: Playwright stealth — fingerprint rotation & fingerprint-suite
  - Body: Integrate a fingerprint rotation mechanism and optional `playwright-extra` compatibility layer. Add a `--fingerprint` CLI flag and CI tests to validate variability.

- Title: Proxy health-check + external provider hooks
  - Body: Implement proxy health checks, integration with external proxy providers (APIs), and runtime metrics. Add CLI options to set rotator strategy.

- Title: Captcha solver plugins (Tesseract + external)
  - Body: Add plugin interface for external captcha solvers and optional cloud connector; add retry/backoff and test harness.

- Title: LangGraph full integration + example flows
  - Body: Expand the LangGraph agent to run multi-step flows, include more examples, and add an integration test that uses Ollama when available.

- Title: CI matrix for Ollama integration
  - Body: Add optional CI job to run Ollama integration tests when a secret OLLAMA_URL is provided.

- Title: Add runtime stealth presets & per-shim toggles documentation
  - Body: Expand README with best-practices and add sample presets.

