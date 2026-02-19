# Bottok-AI Roadmap (Phase 0 → Phase 1 immediate tasks)

This file lists actionable tasks that map to issues you can create in the repo.

## Phase 0 — Completed
- [x] Create modular repo skeleton (core, providers, human, agents, vision, tests)
- [x] Add Playwright human-sim demo + agent stub
- [x] Add tests + CI skeleton (workflow)

## Phase 1 — Quick Wins (next)
- [ ] Add Playwright stealth (playwright-extra + fingerprint rotation)
- [ ] Implement proxy-rotator + proxy-file parsing
- [ ] Replace OCR-only captcha with a pluggable solver interface (Tesseract + optional external)
- [ ] Add persona profiles and `--human-mode` CLI flag
- [ ] Implement comprehensive provider adapter (providers/indirect.js) — port original Bottok provider

## How to convert roadmap items to Issues
You can create issues from each unchecked item. Example (use GH CLI):

```bash
# create issue for Playwright stealth
gh issue create --title "Playwright stealth + fingerprint rotation" --body-file - <<'BODY'
Add playwright-extra + fingerprint-suite; implement rotating fingerprints and UA per session.
BODY
```

Or open `/issues/new` in the repo and paste the task.
