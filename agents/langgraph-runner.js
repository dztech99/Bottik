import { runLangGraphFlow } from './langgraph.js';
import { analyzerWorker, webScraperWorker, llmWorker, validatorWorker, simulatorWorker, reporterWorker, getAtPath } from './langgraph-executors.js';

export async function executeLangGraph(prompt, opts = {}) {
  // pass opts through so runLangGraphFlow can include extended nodes
  const planObj = await runLangGraphFlow(prompt, opts);
  const nodes = (planObj.nodes || []).map(n => ({ ...n }));
  const trace = { plan: planObj.plan || nodes.map(n => n.id), nodes: [], summary: planObj.summary || '' };

  for (const node of nodes) {
    try {
      if (node.role === 'analyzer') {
        node.result = await analyzerWorker(prompt, node, opts);

      } else if (node.role === 'web-scraper') {
        node.result = await webScraperWorker(node, opts);
        // maintain selector compatibility
        if (opts.selector && node.result) {
          const sel = String(opts.selector);
          if (sel === 'title') node.result.selection = node.result.title;
          else if (sel === 'meta:description') node.result.selection = node.result.metaDescription;
          else if (sel.startsWith('json:')) {
            const path = sel.slice('json:'.length);
            node.result.selection = getAtPath(node.result.parsed, path);
          }
        }

      } else if (node.role === 'llm') {
        node.result = await llmWorker(node, prompt, opts);

      } else if (node.role === 'validator') {
        node.result = await validatorWorker(node, nodes, prompt, opts);

      } else if (node.role === 'simulator') {
        node.result = await simulatorWorker(node, opts);

      } else if (node.role === 'reporter') {
        node.result = await reporterWorker(node, nodes, prompt, opts);

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
