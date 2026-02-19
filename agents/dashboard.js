import http from 'http';
import url from 'url';
import traceStore from './trace-store.js';

// optional lightweight WebSocket & token auth support
import { WebSocketServer } from 'ws';

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
<style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;background:#111;color:#e6e6e6;padding:20px}pre{background:#0b0b0b;padding:12px;border-radius:6px;overflow:auto}small{color:#999}</style>
</head>
<body>
  <h2>Bottok-AI — Trace Dashboard <small>(live)</small></h2>
  <p>Live traces (SSE/WebSocket capable)</p>
  <div id="list"></div>
  <script>
    // live updates via WebSocket when available, fallback to polling
    (function(){
      const host = location.hostname; const port = location.port; const wsUrl = 'ws://' + host + ':' + port + '/live';
      try {
        const ws = new WebSocket(wsUrl);
        ws.onmessage = function(e){
          try{ const t = JSON.parse(e.data); const html = '<details><summary>' + new Date(t.ts).toLocaleString() + ' — ' + (t.source||t.origin||'unknown') + ' — ' + (t.prompt?('"'+String(t.prompt).slice(0,60)+'"'):'-') + ' — nodes:' + ((t.trace && t.trace.nodes)?t.trace.nodes.length:0) + '</summary><pre>' + JSON.stringify(t.trace, null, 2) + '</pre></details>'; document.getElementById('list').innerHTML = html + document.getElementById('list').innerHTML; } catch(e){}
        };
        ws.onopen = function(){ console.info('ws: connected'); };
        ws.onerror = function(){ console.info('ws: error, fallback to polling'); draw(); setInterval(draw,2000); };
        return;
      } catch(e){ /* fallthrough to polling */ }
      draw(); setInterval(draw,2000);
    })();

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
  </script>
</body>
</html>
`;

export function startDashboardMode({ host = '127.0.0.1', port = 30050, token = null, persistFile = null } = {}) {
  const server = http.createServer((req, res) => {
    const p = url.parse(req.url, true);

    // authentication (if token provided)
    if (token) {
      const auth = (req.headers.authorization || '').trim();
      if (!auth || !auth.toLowerCase().startsWith('bearer ') || auth.split(' ')[1] !== token) {
        return json(res, { error: 'unauthorized' }, 401);
      }
    }

    if (p.pathname === '/' || p.pathname === '/index.html') return html(res, UI);
    if (p.pathname === '/traces') {
      const limit = parseInt(p.query.limit || '50', 10) || 50;
      return json(res, traceStore.getTraces({ limit }));
    }
    return json(res, { error: 'not_found' }, 404);
  });

  // attach WebSocket server to same HTTP server
  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', (socket) => {
    // send recent traces once connected
    socket.send(JSON.stringify({ type: 'recent', traces: traceStore.getTraces({ limit: 20 }) }));
  });

  server.on('upgrade', (req, socket, head) => {
    const p = url.parse(req.url, true);
    // require path /live
    if (p.pathname !== '/live') { socket.destroy(); return; }

    // token check for websocket (if configured)
    if (token) {
      const qtoken = p.query && p.query.token;
      if (!qtoken || qtoken !== token) { socket.destroy(); return; }
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  // broadcast on new trace
  const onPush = (rec) => {
    const msg = JSON.stringify(rec);
    for (const c of wss.clients) {
      if (c.readyState === c.OPEN) c.send(msg);
    }
  };
  traceStore.on('push', onPush);

  // optional persistence
  if (persistFile) {
    try { traceStore.saveToFile(persistFile); } catch (e) { /* ignore */ }
  }

  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const assigned = server.address();
      resolve({ server, host: assigned.address, port: assigned.port, wss, close: () => { traceStore.removeListener('push', onPush); wss.close(); server.close(); } });
    });
    server.on('error', reject);
  });
}
