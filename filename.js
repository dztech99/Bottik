{
  "name": "bottok-ai",
  "version": "2.0.0",
  "description": "AI-Powered TikTok Automation – 100% Free & Open Source (Playwright + Ollama)",
  "main": "core/cli.js",
  "type": "module",
  "scripts": {
    "start": "node core/cli.js",
    "dev": "node --watch core/cli.js",
    "test": "node tests/basic.test.js",
    "install-playwright": "npx playwright install --with-deps"
  },
  "dependencies": {
    "playwright": "^1.50.0",
    "puppeteer": "19.8.5",
    "@langchain/core": "^0.3.0",
    "@langchain/langgraph": "^0.2.0",
    "@langchain/community": "^0.3.0",
    "ollama": "^0.5.0",
    "inquirer": "9.1.4",
    "minimist": "1.2.7",
    "node-fetch": "^3.3.2",
    "jimp": "^0.22.12",
    "tesseract.js": "^5.1.1",
    "terminal-image": "2.0.0",
    "sqlite3": "^5.1.7",
    "ghost-cursor-playwright": "latest",
    "wind-mouse": "^1.0.0"
  },
  "devDependencies": {
    "playwright-test": "latest"
  }
}
