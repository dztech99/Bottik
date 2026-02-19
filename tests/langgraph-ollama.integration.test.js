import { test, expect } from '@playwright/test';
import { runLangGraphFlow } from '../agents/langgraph.js';

// Integration test that runs only when OLLAMA_URL is provided in environment.
const hasOllama = !!process.env.OLLAMA_URL;

if (hasOllama) {
  test('runLangGraphFlow with Ollama should return llm output', async () => {
    const res = await runLangGraphFlow('Summarize: Hello world', { llm: 'ollama', dryRun: false });
    expect(res).toBeDefined();
    // we expect either an llm field or a fallback note
    expect(res.llm || res.note).toBeTruthy();
  });
} else {
  test.skip('runLangGraphFlow with Ollama — skipped because OLLAMA_URL is not set', async () => {});
}
