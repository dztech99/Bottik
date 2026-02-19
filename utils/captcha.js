import Tesseract from 'tesseract.js';

export async function solveCaptcha(input, opts = {}) {
  // input can be Buffer or file path; opts.simulate returns a canned value
  if (opts.simulate) return 'SIMULATED';
  try {
    if (typeof input === 'string') {
      const res = await Tesseract.recognize(input, 'eng');
      return (res && res.data && res.data.text) ? res.data.text.trim() : '';
    }
    // Buffer
    const res = await Tesseract.recognize(input, 'eng');
    return (res && res.data && res.data.text) ? res.data.text.trim() : '';
  } catch (err) {
    throw new Error('captcha-solve-failed');
  }
}
