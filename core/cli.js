import minimist from 'minimist';
import config from '../config/default.js';
import { startIndirectMode } from '../providers/indirect.js';
import { launchHumanBrowser, simulateHumanActions } from '../human/simulator.js';
import { startAgentMode } from '../agents/tiktok-agent.js';

const args = minimist(process.argv.slice(2));

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
