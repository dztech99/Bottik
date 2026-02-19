// import fs from 'fs';
import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import traceStore from './trace-store.js';
import { openTraceDB, getRecentTraces } from './trace-sqlite.js';

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
  <div style="margin-bottom:12px">
    <label style="font-size:13px">Run a flow:</label>
    <input id="runFlowInput" placeholder="enter flow (e.g. audit user)" style="width:60%;padding:6px;margin-left:8px;border-radius:4px;border:1px solid #333;background:#0b0b0b;color:#eee" />
    <button id="runFlowBtn" style="margin-left:8px;padding:6px 10px;border-radius:4px;background:#1e90ff;color:#fff;border:none;">Run</button>
    <span id="runStatus" style="margin-left:12px;color:#999"></span>
  </div>
  <div id="list"></div>
  <script>
    // run-flow UI
    document.addEventListener('DOMContentLoaded', function(){
      const btn = document.getElementById('runFlowBtn');
      const input = document.getElementById('runFlowInput');
      const status = document.getElementById('runStatus');
      btn.addEventListener('click', async () => {
        const flow = input.value || 'quick check';
        status.innerText = 'running…';
        try {
          const res = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flow, dryRun: true, extended: true, providerDryRun: true }) });
          const j = await res.json();
          status.innerText = j.ok ? 'started' : 'error';
        } catch (e) { status.innerText = 'error'; }
        setTimeout(()=> status.innerText = '', 1500);
      });
    });

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
  const dbPath = persistFile || path.resolve(process.cwd(), '.bottok_traces.sqlite');
  const server = http.createServer(async (req, res) => {
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
      let db;
      try {
        db = await openTraceDB(dbPath);
        const traces = await getRecentTraces(db, limit);
        await db.close();
        return json(res, traces);
      } catch (e) {
        if (db) {
          try { await db.close(); } catch (closeErr) { /* log close error */ console.error('Error closing DB:', closeErr); }
        }
        console.error('SQLite DB error in /traces:', e);
        return json(res, { error: 'db_error', detail: String(e) }, 500);
      }
    }

    // run a flow (POST) — expects JSON { flow, llm, dryRun, extended, providerDryRun }
    if (p.pathname === '/run' && req.method === 'POST') {
      // auth already enforced above if token configured
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const { flow, llm, dryRun, extended, providerDryRun } = payload;
          // execute orchestrator synchronously and return trace
          const { startOrchestratorMode } = await import('./orchestrator.js');
          const resObj = await startOrchestratorMode({ flow, llm, dryRun, extended, providerDryRun });
          return json(res, { ok: true, result: resObj }, 200);
        } catch (e) {
          return json(res, { ok: false, error: String(e) }, 500);
        }
      });
      return;
    }

    return json(res, { error: 'not_found' }, 404);
  });

  // attach WebSocket server to same HTTP server
  const wss = new WebSocketServer({ noServer: true });
  // Keep track of all connected WebSocket clients
  const wsClients = new Set();
  wss.on('connection', (socket) => {
    wsClients.add(socket);
    // send recent traces once connected (from SQLite)
    (async () => {
      try {
        const db = await openTraceDB(dbPath);
        const traces = await getRecentTraces(db, 20);
        await db.close();
        socket.send(JSON.stringify({ type: 'recent', traces }));
      } catch (e) {
        socket.send(JSON.stringify({ type: 'error', error: 'db_error', detail: String(e) }));
      }
    })();
    socket.on('close', () => wsClients.delete(socket));
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

  // Broadcast a new trace to all connected WebSocket clients
  async function broadcastNewTrace(trace) {
    const msg = JSON.stringify(trace);
    for (const ws of wsClients) {
      if (ws.readyState === ws.OPEN) {
        try { ws.send(msg); } catch (e) { /* ignore */ }
      }
    }
  }

  // Patch POST /run endpoint to broadcast new trace after insertion
  // (Monkey-patch startOrchestratorMode to intercept trace insertion)
  const origImport = globalThis.__importOrchestrator || (async (...args) => await import('./orchestrator.js'));
  globalThis.__importOrchestrator = async (...args) => {
    const mod = await origImport(...args);
    if (!mod.__wsPatched) {
      const origStart = mod.startOrchestratorMode;
      mod.startOrchestratorMode = async function patchedStartOrchestratorMode(opts) {
        const res = await origStart.call(this, opts);
        // After orchestrator runs, get the latest trace and broadcast
        try {
          const db = await openTraceDB(dbPath);
          const traces = await getRecentTraces(db, 1);
          await db.close();
          if (traces && traces[0]) await broadcastNewTrace(traces[0]);
        } catch (e) { /* ignore */ }
        return res;
      };
      mod.__wsPatched = true;
    }
    return mod;
  };

  // optional persistence (default to .bottok_traces.json when not provided)
  // SQLite: no file watcher needed

  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const assigned = server.address();
      resolve({ server, host: assigned.address, port: assigned.port, wss, close: () => { wss.close(); server.close(); } });
    });
    server.on('error', reject);
  });
}
