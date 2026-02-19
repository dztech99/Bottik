import { generate as ollamaGenerate, isOllamaAvailable } from './ollama.js';
import { runProviderTask } from '../providers/indirect.js';

// --- helpers ---
export const hasPath = (obj, path) => {
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

export const getAtPath = (obj, path) => {
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

export const extractTitle = (html = '') => {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return m ? m[1].trim() : undefined;
};

export const extractMetaDescription = (html = '') => {
  const m = /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i.exec(html);
  return m ? m[1].trim() : undefined;
};

// --- role workers ---
export async function analyzerWorker(prompt, node, opts = {}) {
  const text = String(prompt || '');
  const words = text.split(/\s+/).filter(w => w.length > 3);
  return { keywords: words.slice(0, 6), wordCount: words.length };
}

export async function webScraperWorker(node, opts = {}) {
  const target = opts.target || 'about:blank';

  let result;

  if (String(target).startsWith('inline:')) {
    const payload = String(target).slice('inline:'.length);
    const trimmed = String(payload).trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(payload);
        result = { url: target, contentType: 'json', parsed, snippet: JSON.stringify(parsed).slice(0, 512) };
      } catch (e) {
        result = { url: target, error: 'invalid-json-inline', snippet: String(payload).slice(0, 512) };
      }
    } else {
      const title = extractTitle(payload);
      const metaDescription = extractMetaDescription(payload);
      result = { url: target, contentType: 'html', title, metaDescription, content: payload, snippet: String(payload).slice(0, 512) };
    }

  } else if (opts.providerDryRun || opts.dryRun) {
    result = { url: target, content: `SIMULATED_CONTENT for ${target}`, snippet: String(target).slice(0, 128) };

  } else {
    try {
      const fetch = (await import('node-fetch')).default;
      const resp = await fetch(target, { timeout: 5000 });
      const contentType = resp.headers.get('content-type') || '';
      const text = await resp.text();

      if (contentType.includes('application/json') || String(text).trim().startsWith('{') || String(text).trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(text);
          result = { url: target, status: resp.status, contentType: 'json', parsed, snippet: JSON.stringify(parsed).slice(0, 512) };
        } catch (e) {
          result = { url: target, status: resp.status, contentType: contentType || 'text', snippet: String(text).slice(0, 512) };
        }
      } else {
        const title = extractTitle(text);
        const metaDescription = extractMetaDescription(text);
        result = { url: target, status: resp.status, contentType: 'html', title, metaDescription, content: text, snippet: String(text).slice(0, 512) };
      }
    } catch (e) {
      result = { url: target, error: String(e) };
    }
  }

  // selector extraction (opts.selector)
  if (opts.selector && result) {
    const sel = String(opts.selector);
    if (sel === 'title') result.selection = result.title;
    else if (sel === 'meta:description') result.selection = result.metaDescription;
    else if (sel.startsWith('json:')) {
      const path = sel.slice('json:'.length);
      result.selection = getAtPath(result.parsed, path);
    } else if (sel.startsWith('jsonpath:')) {
      const expr = sel.slice('jsonpath:'.length);
      try {
        const mod = await import('jsonpath-plus');
        const JSONPath = mod.JSONPath ?? mod;
        const out = JSONPath({ path: expr, json: result.parsed });
        result.selection = Array.isArray(out) ? out[0] : out;
      } catch (e) {
        result.selection = undefined;
        result.selectionError = String(e);
      }
    } else if (sel.startsWith('css:')) {
      const cssSelRaw = sel.slice('css:'.length);
      const [cssSel, attr] = String(cssSelRaw).split('@');
      const html = result.content || result.snippet || '';
      try {
        const mod = await import('cheerio');
        const cheerio = mod.default ?? mod;
        const $ = cheerio.load(html);
        const el = $(cssSel).first();
        result.selection = el.length ? (attr ? el.attr(attr) : el.text().trim()) : undefined;
      } catch (e) {
        result.selection = undefined;
        result.selectionError = String(e);
      }
    }
  }

  return result;
}

export async function llmWorker(node, prompt, opts = {}) {
  if (opts.llm === 'ollama') {
    if (opts.dryRun) return 'ollama-dryRun';
    const ok = await isOllamaAvailable();
    if (!ok) throw new Error('ollama-not-available');
    const out = await ollamaGenerate(prompt, { model: opts.model || 'llama2' });
    return String(out).slice(0, 200);
  }
  // mock / simulated LLM
  return 'llm-simulated';
}

export async function validatorWorker(node, allNodes, prompt, opts = {}) {
  const llmNode = allNodes.find(n => n.role === 'llm');
  const scraped = allNodes.find(n => n.role === 'web-scraper');

  if (opts.schema && opts.schema.type === 'json' && Array.isArray(opts.schema.required)) {
    const parsed = scraped?.result?.parsed || (typeof llmNode?.result === 'string' ? (() => {
      try { return JSON.parse(llmNode.result); } catch { return null; }
    })() : null);

    const req = opts.schema.required || [];
    const missing = [];
    for (const p of req) {
      if (!hasPath(parsed, p)) missing.push(p);
    }
    return { valid: missing.length === 0, missing };
  }

  const hay = [llmNode?.result, scraped?.result?.content, prompt].filter(Boolean).join(' ');
  const required = Array.isArray(opts.require) ? opts.require : (opts.require ? [opts.require] : []);
  const missing = required.filter(r => String(hay).toLowerCase().indexOf(String(r).toLowerCase()) === -1);
  return { valid: missing.length === 0, missing };
}

export async function simulatorWorker(node, opts = {}) {
  const providerArgs = { dryRun: !!(opts.providerDryRun ?? opts.dryRun), persona: opts.persona || null };
  let task = 'simulate';
  if (opts.action === 'live') task = 'live';
  const res = await runProviderTask({ task, url: opts.target || 'about:blank', args: providerArgs });
  return res;
}

export async function reporterWorker(node, allNodes, prompt, opts = {}) {
  return {
    summary: `Report for ${String(prompt).slice(0, 80)}`,
    nodes: allNodes.map(n => ({ id: n.id, result: n.result }))
  };
}
