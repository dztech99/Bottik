import http from 'http';
import url from 'url';

export function startWorkerServer({ host = '127.0.0.1', port = 0 } = {}) {
  const server = http.createServer(async (req, res) => {
    const p = url.parse(req.url, true);
    if (p.pathname === '/execute' && req.method === 'POST') {
      try {
        let body = '';
        for await (const chunk of req) body += chunk;
        const { role, node, prompt, opts } = JSON.parse(body || '{}');
        const mod = await import('./langgraph-executors.js');
        let result;
        if (role === 'analyzer') result = await mod.analyzerWorker(prompt, node, opts || {});
        else if (role === 'web-scraper') result = await mod.webScraperWorker(node, opts || {});
        else if (role === 'llm') result = await mod.llmWorker(node, prompt, opts || {});
        else if (role === 'validator') result = await mod.validatorWorker(node, [], prompt, opts || {});
        else if (role === 'simulator') result = await mod.simulatorWorker(node, opts || {});
        else if (role === 'reporter') result = await mod.reporterWorker(node, [], prompt, opts || {});
        else result = 'noop';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
  });

  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const assigned = server.address();
      resolve({ server, host: assigned.address, port: assigned.port, close: () => server.close() });
    });
    server.on('error', reject);
  });
}
