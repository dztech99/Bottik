// Lightweight worker client with HTTP remote adapter and local in-process fallback
export function createWorkerClient({ url } = {}) {
  if (url) {
    // remote HTTP adapter
    return {
      async execute({ role, node, prompt, opts = {} }) {
        const res = await fetch(url.replace(/\/$/, '') + '/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, node, prompt, opts })
        });
        if (!res.ok) throw new Error(`worker-remote-failed:${res.status}`);
        return await res.json();
      }
    };
  }

  // local in-process adapter — call executor functions directly
  return {
    async execute({ role, node, prompt, opts = {} }) {
      const mod = await import('./langgraph-executors.js');
      if (role === 'analyzer') return await mod.analyzerWorker(prompt, node, opts);
      if (role === 'web-scraper') return await mod.webScraperWorker(node, opts);
      if (role === 'llm') return await mod.llmWorker(node, prompt, opts);
      if (role === 'validator') return await mod.validatorWorker(node, [], prompt, opts);
      if (role === 'simulator') return await mod.simulatorWorker(node, opts);
      if (role === 'reporter') return await mod.reporterWorker(node, [], prompt, opts);
      return 'noop';
    }
  };
}