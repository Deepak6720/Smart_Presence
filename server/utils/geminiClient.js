const { GoogleGenAI } = require('@google/genai');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseRetryDelayMs = (error) => {
  try {
    const str = typeof error === 'string' ? error : JSON.stringify(error);
    const match = str.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
    if (match) return Math.ceil(parseFloat(match[1])) * 1000 + 2000;
    const msgMatch = str.match(/retry\s+in\s+(\d+(?:\.\d+)?)\s*s/i);
    if (msgMatch) return Math.ceil(parseFloat(msgMatch[1])) * 1000 + 2000;
  } catch {}
  return null;
};

const isRateLimitError = (error) => {
  const str = JSON.stringify(error) || '';
  return (
    str.includes('429') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('quota')
  );
};

const isUnavailableError = (error) => {
  const str = JSON.stringify(error) || '';
  return str.includes('503') || str.includes('UNAVAILABLE');
};

const callGemini = async (prompt, { maxRetries = 2, baseDelay = 5000 } = {}) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const text = response.text;
      if (!text || text.trim() === '') {
        throw new Error('Gemini returned an empty response');
      }
      return text;

    } catch (error) {
      lastError = error;

      const retryable = isRateLimitError(error) || isUnavailableError(error);

      if (retryable && attempt < maxRetries) {
        const suggested = parseRetryDelayMs(error);
        const waitMs = suggested ?? (baseDelay * Math.pow(2, attempt));

        const reason = isRateLimitError(error) ? 'rate limited' : 'temporarily unavailable';
        console.warn(`⏳ Gemini ${reason} (attempt ${attempt + 1}/${maxRetries + 1}). Waiting ${(waitMs / 1000).toFixed(0)}s...`);
        await sleep(waitMs);
      } else {
        break;
      }
    }
  }

  throw lastError;
};

module.exports = { callGemini };