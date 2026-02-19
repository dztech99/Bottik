import http from 'http';
import url from 'url';
import traceStore from './trace-store.js';

function json(res, obj, code = 200) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function html(res, body, code = 200) {
  res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

const UI = `
<!doctype html>
<html>
<head><meta charset="utf-8"><title>Bottok-AI — Trace Dashboard</title>
<style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;background:#111;color:#e6e6e6;padding:20px}pre{background:#0b0b0b;padding:12px;border-radius:6px;overflow:auto}</style>
</head>
<body>
  <h2>Bottok-AI — Trace Dashboard</h2>
  <p>Auto-refreshing list of recent traces (in-memory)</p>
  <div id="list"></div>
  <script>
    async function draw(){
      try{
        const r = await fetch('/traces');
        const j = await r.json();
        const out = j.map(function(t){
          const nodesCount = (t && t.trace && t.trace.nodes) ? t.trace.nodes.length : 0;
          const promptShort = t.prompt ? '"' + String(t.prompt).slice(0,60) + '"' : '-';
          return '<details><summary>' + new Date(t.ts).toLocaleString() + ' — ' + (t.source||t.origin||'unknown') + ' — ' + promptShort + ' — nodes:' + nodesCount + '</summary><pre>' + JSON.stringify(t.trace, null, 2) + '</pre></details>';
        }).join('\n');
        document.getElementById('list').innerHTML = out || '<i>no traces</i>';
      }catch(e){ document.getElementById('list').innerText = 'error: '+e.message }
    }
    draw(); setInterval(draw, 2000);
  </script>
</body>
</html>
`;

export function startDashboardMode({ host = '127.0.0.1', port = 3001 } = {}) {
  const server = http.createServer((req, res) => {
    const p = url.parse(req.url, true);
    if (p.pathname === '/' || p.pathname === '/index.html') return html(res, UI);
    if (p.pathname === '/traces') {
      const limit = parseInt(p.query.limit || '50', 10) || 50;
      return json(res, traceStore.getTraces({ limit }));
    }
    return json(res, { error: 'not_found' }, 404);
  });

  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const assigned = server.address();
      resolve({ server, host: assigned.address, port: assigned.port, close: () => server.close() });
    });
    server.on('error', reject);
  });
}
