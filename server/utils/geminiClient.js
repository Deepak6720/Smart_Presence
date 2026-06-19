'use strict';
const { GoogleGenAI } = require('@google/genai');
let lastCallTime = 0;
const MIN_GAP_MS = 8_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const extractRetryMs = (raw) => {
  try {
    const body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const details = body?.error?.details ?? [];
    for (const d of details) {
      if (d['@type']?.includes('RetryInfo') && d.retryDelay) {
        const s = parseFloat(String(d.retryDelay).replace('s', ''));
        if (!isNaN(s)) return Math.ceil(s * 1000) + 3_000;
      }
    }
  } catch {}
  return null;
};

const classify = (raw) => {
  const s = typeof raw === 'string' ? raw : JSON.stringify(raw);
  if (s.includes('RESOURCE_EXHAUSTED') && (s.includes('PerDay') || s.includes('PerDayPer')))
    return 'QUOTA_DAILY';
  if (s.includes('RESOURCE_EXHAUSTED')) return 'QUOTA_RATE';
  if (s.includes('UNAVAILABLE') || s.includes('503'))        return 'TRANSIENT';
  if (s.includes('INVALID_ARGUMENT') || s.includes('PERMISSION_DENIED')) return 'NO_RETRY';
  return 'UNKNOWN';
};

const callGemini = async (prompt, { retries = 3, maxOutputTokens = 4096 } = {}) => {

  for (let attempt = 1; attempt <= retries; attempt++) {
    const elapsed = Date.now() - lastCallTime;
    if (elapsed < MIN_GAP_MS) await sleep(MIN_GAP_MS - elapsed);

    try {
      lastCallTime = Date.now();
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens,                         
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      return response.text;

    } catch (err) {
      const raw  = err?.message ?? JSON.stringify(err);
      const kind = classify(raw);

      if (kind === 'QUOTA_DAILY') {
        const e = new Error('GEMINI_DAILY_QUOTA_EXHAUSTED');
        e.kind = 'QUOTA_DAILY';
        throw e;
      }
      if (kind === 'NO_RETRY') throw err;

      if (attempt < retries) {
        const wait = extractRetryMs(raw) ?? attempt * 15_000;
        console.warn(`⚠️  Gemini attempt ${attempt}/${retries} [${kind}] — retrying in ${Math.round(wait / 1000)}s`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
};

module.exports = { callGemini };