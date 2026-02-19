import minimist from 'minimist';
import config from '../config/default.js';
import { startIndirectMode } from '../providers/indirect.js';
import { launchHumanBrowser, simulateHumanActions } from '../human/simulator.js';
import { startAgentMode } from '../agents/tiktok-agent.js';
import { startLangGraphMode } from '../agents/langgraph-agent.js';
import { startOrchestratorMode } from '../agents/orchestrator.js';
import { startDashboardMode } from '../agents/dashboard.js';

const rawArgs = minimist(process.argv.slice(2));
const args = { ...rawArgs };

// normalize proxy-file / proxyFile -> proxies
if (rawArgs['proxy-file'] && !rawArgs.proxies) args.proxies = rawArgs['proxy-file'];
if (rawArgs.proxyFile && !rawArgs.proxies) args.proxies = rawArgs.proxyFile;
// expose persona flag directly
if (rawArgs.persona) args.persona = rawArgs.persona;

// stealth level: none | lite | full (default: full)
const stealthRaw = rawArgs.stealth || rawArgs['stealth'] || rawArgs['stealth-level'] || rawArgs['stealthLevel'];
args.stealth = stealthRaw ? String(stealthRaw).toLowerCase() : 'full';
if (!['none','lite','full'].includes(args.stealth)) args.stealth = 'full';

// stealth-disable: comma-separated list of shims to disable (e.g. canvas,toString,fonts)
const stealthDisableRaw = rawArgs['stealth-disable'] || rawArgs.stealthDisable || rawArgs['disable-shims'] || rawArgs.disableShims;
args.stealthDisable = stealthDisableRaw ? String(stealthDisableRaw).split(',').map(s => s.trim()).filter(Boolean) : [];

// stealth presets: map friendly presets to stealth level + disabled shims
const STEALTH_PRESETS = {
  full: { stealth: 'full', stealthDisable: [] },
  lite: { stealth: 'lite', stealthDisable: [] },
  privacy: { stealth: 'full', stealthDisable: [] },
  compat: { stealth: 'lite', stealthDisable: ['canvas', 'toString'] }
};

const presetRaw = rawArgs['stealth-preset'] || rawArgs.stealthPreset || rawArgs['preset'] || rawArgs.preset;
args.stealthPreset = presetRaw ? String(presetRaw).toLowerCase() : undefined;
if (args.stealthPreset && STEALTH_PRESETS[args.stealthPreset]) {
  const p = STEALTH_PRESETS[args.stealthPreset];
  // apply preset values only when explicit flags were not provided
  if (!stealthRaw) args.stealth = p.stealth;
  if (!stealthDisableRaw || stealthDisableRaw === '') args.stealthDisable = p.stealthDisable.slice();
}

// rotate-fingerprint / fingerprint alias
if (rawArgs['rotate-fingerprint'] || rawArgs.rotateFingerprint) args.rotateFingerprint = true;
if (rawArgs.fingerprint && !rawArgs.persona) args.persona = rawArgs.fingerprint;
// providerDryRun: run provider simulation even when other steps may call network
args.providerDryRun = !!(rawArgs['provider-dryrun'] || rawArgs.providerDryRun || false);

console.log('🚀 Bottok-AI (local) — lightweight demo');

async function main() {
  if (args.agent) {
    await startAgentMode(args);
  } else if (args.agentic) {
    // run pipeline-style orchestrator (analyzer → web-scraper → validator → simulator → reporter)
    const out = await startOrchestratorMode(args);
    console.log('Orchestrator flow result:', out);
  } else if (args.dashboard) {
    // allow explicit 0 (ephemeral) port — treat only undefined as missing
    const port = (typeof args.port !== 'undefined') ? Number(args.port) : 3001;
    const server = await startDashboardMode({ port });
    console.log(`Dashboard listening at http://${server.host}:${server.port}/`);
    // keep process alive while dashboard runs
    await new Promise(() => {});
  } else if (args.flow) {
    // allow `--flow-extended` / `--provider-dryrun` / `--require` flags to be passed through
    const out = await startLangGraphMode(args);
    console.log('LangGraph flow result:', out);
  } else if (args.mode === 'direct' || args.human) {
    const { page, browser } = await launchHumanBrowser(args);
    await simulateHumanActions(page, args);
    await browser.close();
  } else {
    await startIndirectMode(args);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
