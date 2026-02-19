import fs from 'fs';

export function parseProxyLine(line) {
  if (!line) return null;
  const trimmed = line.trim();
  if (!trimmed) return null;
  // format: [user:pass@]host:port
  return trimmed;
}

export function loadProxiesFromFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw
      .split(/\r?\n/)
      .map(parseProxyLine)
      .filter(Boolean);
  } catch (err) {
    return [];
  }
}

export function pickRandomProxy(proxies = []) {
  if (!proxies || proxies.length === 0) return null;
  return proxies[Math.floor(Math.random() * proxies.length)];
}
