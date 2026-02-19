import fetch from 'node-fetch';
import config from '../config/default.js';

export async function analyzeScreenshot(imagePath) {
  // Placeholder: local Ollama/Llava integration would go here.
  // For now return a deterministic message so tests remain offline-safe.
  return { summary: `analyzed ${imagePath}` };
}
