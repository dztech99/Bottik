import minimist from 'minimist';
import config from '../config/default.js';
import { startIndirectMode } from '../providers/indirect.js';
import { launchHumanBrowser, simulateHumanActions } from '../human/simulator.js';
import { startAgentMode } from '../agents/tiktok-agent.js';

const rawArgs = minimist(process.argv.slice(2));
const args = { ...rawArgs };

// normalize proxy-file / proxyFile -> proxies
if (rawArgs['proxy-file'] && !rawArgs.proxies) args.proxies = rawArgs['proxy-file'];
if (rawArgs.proxyFile && !rawArgs.proxies) args.proxies = rawArgs.proxyFile;
// expose persona flag directly
if (rawArgs.persona) args.persona = rawArgs.persona;

console.log('🚀 Bottok-AI (local) — lightweight demo');

async function main() {
  if (args.agent) {
    await startAgentMode(args);
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
