import { runLangGraphFlow } from './langgraph.js';
import { generate as ollamaGenerate, isOllamaAvailable } from './ollama.js';
import { runProviderTask } from '../providers/indirect.js';

export async function executeLangGraph(prompt, opts = {}) {
  // pass opts through so runLangGraphFlow can include extended nodes
  const planObj = await runLangGraphFlow(prompt, opts);
  const nodes = (planObj.nodes || []).map(n => ({ ...n }));
  const trace = { plan: planObj.plan || nodes.map(n => n.id), nodes: [], summary: planObj.summary || '' };

  // helper: check nested path existence (dot notation)
  const hasPath = (obj, path) => {
    if (!obj || !path) return false;
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
        cur = cur[p];
      } else {
        return false;
      }
    }
    return true;
  };

  const getAtPath = (obj, path) => {
    if (!obj || !path) return undefined;
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
        cur = cur[p];
      } else {
        return undefined;
      }
    }
    return cur;
  };

  const extractTitle = (html = '') => {
    const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
    return m ? m[1].trim() : undefined;
  };

  const extractMetaDescription = (html = '') => {
    const m = /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i.exec(html);
    return m ? m[1].trim() : undefined;
  };

  for (const node of nodes) {
    try {
      if (node.role === 'analyzer') {
        // lightweight analysis: count words and extract simple keywords
        const text = String(prompt || '');
        const words = text.split(/\s+/).filter(w => w.length > 3);
        node.result = { keywords: words.slice(0, 6), wordCount: words.length };

      } else if (node.role === 'web-scraper') {
        // web-scraper supports:
        // - inline:... targets (no network) with HTML or JSON payloads
        // - selector-based extraction (title / meta:description / json path)
        // - providerDryRun / dryRun fallbacks for non-inline targets
        const target = opts.target || 'about:blank';

        // inline payloads are always parsed (safe for tests/dev)
        if (String(target).startsWith('inline:')) {
          const payload = String(target).slice('inline:'.length);
          const trimmed = String(payload).trim();
          // JSON payload
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              const parsed = JSON.parse(payload);
              node.result = { url: target, contentType: 'json', parsed, snippet: JSON.stringify(parsed).slice(0, 512) };
            } catch (e) {
              node.result = { url: target, error: 'invalid-json-inline', snippet: String(payload).slice(0, 512) };
            }
          } else {
            // treat as HTML
            const title = extractTitle(payload);
            const metaDescription = extractMetaDescription(payload);
            node.result = { url: target, contentType: 'html', title, metaDescription, content: payload, snippet: String(payload).slice(0, 512) };
          }

        } else if (opts.providerDryRun || opts.dryRun) {
          node.result = { url: target, content: `SIMULATED_CONTENT for ${target}`, snippet: String(target).slice(0, 128) };

        } else {
          // real fetch (network) - use node-fetch (dependency present)
          try {
            const fetch = (await import('node-fetch')).default; // lazy import
            const resp = await fetch(target, { timeout: 5000 });
            const contentType = resp.headers.get('content-type') || '';
            const text = await resp.text();

            if (contentType.includes('application/json') || String(text).trim().startsWith('{') || String(text).trim().startsWith('[')) {
              try {
                const parsed = JSON.parse(text);
                node.result = { url: target, status: resp.status, contentType: 'json', parsed, snippet: JSON.stringify(parsed).slice(0, 512) };
              } catch (e) {
                node.result = { url: target, status: resp.status, contentType: contentType || 'text', snippet: String(text).slice(0, 512) };
              }
            } else {
              const title = extractTitle(text);
              const metaDescription = extractMetaDescription(text);
              node.result = { url: target, status: resp.status, contentType: 'html', title, metaDescription, content: text, snippet: String(text).slice(0, 512) };
            }
          } catch (e) {
            node.result = { url: target, error: String(e) };
          }
        }

        // allow selector-style extraction
        if (opts.selector && node.result) {
          const sel = String(opts.selector);
          if (sel === 'title') node.result.selection = node.result.title;
          else if (sel === 'meta:description') node.result.selection = node.result.metaDescription;
          else if (sel.startsWith('json:')) {
            const path = sel.slice('json:'.length);
            node.result.selection = getAtPath(node.result.parsed, path);
          } else if (sel.startsWith('css:')) {
            // css:<selector> — use cheerio to query HTML content (lazy import)
            const cssSel = sel.slice('css:'.length);
            const html = node.result.content || node.result.snippet || '';
            try {
              const mod = await import('cheerio');
              const cheerio = mod.default ?? mod;
              const $ = cheerio.load(html);
              const el = $(cssSel).first();
              node.result.selection = el.length ? el.text().trim() : undefined;
            } catch (e) {
              node.result.selection = undefined;
              node.result.selectionError = String(e);
            }
          }
        }

      } else if (node.role === 'llm') {
        if (opts.llm === 'ollama') {
          if (opts.dryRun) {
            node.result = 'ollama-dryRun';
          } else {
            const ok = await isOllamaAvailable();
            if (!ok) throw new Error('ollama-not-available');
            const out = await ollamaGenerate(prompt, { model: opts.model || 'llama2' });
            node.result = String(out).slice(0, 200);
          }
        } else {
          node.result = 'llm-simulated';
        }

      } else if (node.role === 'validator') {
        // validator inspects previous results and returns a pass/fail without throwing
        const llmNode = nodes.find(n => n.role === 'llm');
        const scraped = nodes.find(n => n.role === 'web-scraper');

        // If a JSON schema-like requirement is provided, prefer structural checks
        if (opts.schema && opts.schema.type === 'json' && Array.isArray(opts.schema.required)) {
          // try to locate a parsed JSON object from scraped or llm outputs
          const parsed = scraped?.result?.parsed || (typeof llmNode?.result === 'string' ? (() => {
            try { return JSON.parse(llmNode.result); } catch { return null; }
          })() : null);

          const req = opts.schema.required || [];
          const missing = [];
          for (const p of req) {
            if (!hasPath(parsed, p)) missing.push(p);
          }
          node.result = { valid: missing.length === 0, missing };

        } else {
          // fallback: text-based "must contain" checks using opts.require
          const hay = [llmNode?.result, scraped?.result?.content, prompt].filter(Boolean).join(' ');
          const required = Array.isArray(opts.require) ? opts.require : (opts.require ? [opts.require] : []);
          const missing = required.filter(r => String(hay).toLowerCase().indexOf(String(r).toLowerCase()) === -1);
          node.result = { valid: missing.length === 0, missing };
        }

      } else if (node.role === 'simulator') {
        // call provider to perform simulation; providerDryRun overrides
        const providerArgs = { dryRun: !!(opts.providerDryRun ?? opts.dryRun) };
        const res = await runProviderTask({ task: 'simulate', url: opts.target || 'about:blank', args: providerArgs });
        node.result = res;

      } else if (node.role === 'reporter') {
        // collate previous node outputs into a short report
        node.result = {
          summary: trace.summary || `Report for ${String(prompt).slice(0, 80)}`,
          nodes: nodes.map(n => ({ id: n.id, result: n.result }))
        };
      } else {
        node.result = 'noop';
      }

      trace.nodes.push({ id: node.id, role: node.role, result: node.result });
    } catch (err) {
      node.error = String(err?.message || err);
      trace.nodes.push({ id: node.id, role: node.role, error: node.error });
      return { ok: false, error: node.error, trace };
    }
  }

  return { ok: true, trace };
}
