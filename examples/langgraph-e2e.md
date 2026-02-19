# LangGraph + Ollama end-to-end example

Prerequisites
- Run a local Ollama instance or set OLLAMA_URL to a reachable endpoint.

Example (CLI):

1. Start a local Ollama server (if you have one):
   export OLLAMA_URL=http://127.0.0.1:11434

2. Run a demo LangGraph flow (dry-run to avoid network):
   node core/cli.js --flow "audit session" --llm ollama --dryRun

3. To execute against Ollama (only if OLLAMA_URL is set):
   node core/cli.js --flow "audit session" --llm ollama

Notes
- Tests include an integration test that will only run when `OLLAMA_URL` is present in the environment.
- The implementation is intentionally defensive: dry-run paths avoid network calls and return deterministic plans for CI.
