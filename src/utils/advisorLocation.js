/**
 * Normalisation shared by AprIQ advisor UI and api/ai-advisor so Places-autocomplete
 * strings (often long; may include zero-width chars) match what the model sees and
 * stay within a safe length for prompts.
 */
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;

/**
 * @param {unknown} raw
 * @param {{ maxLength?: number }} [options] maxLength 0 = no cap
 */
export function normalizeAdvisorLocation(raw, options = {}) {
  const maxLength = options.maxLength ?? 400;
  if (typeof raw !== 'string') return '';
  let s = raw.replace(ZERO_WIDTH_RE, ' ').replace(/\s+/g, ' ').trim();
  if (maxLength > 0 && s.length > maxLength) s = s.slice(0, maxLength).trim();
  return s;
}

/** General user question text: trim and strip zero-width; optional hard cap for abuse. */
export function normalizeAdvisorUserMessage(raw, maxLength = 12000) {
  if (typeof raw !== 'string') return '';
  let s = raw.replace(ZERO_WIDTH_RE, ' ').replace(/\s+/g, ' ').trim();
  if (maxLength > 0 && s.length > maxLength) s = s.slice(0, maxLength).trim();
  return s;
}

export function sanitizeEstimateLocationInState(estimateState) {
  if (!estimateState || typeof estimateState !== 'object') return estimateState;
  const pl = estimateState.projectLocation;
  if (!pl || typeof pl !== 'object') return estimateState;
  return {
    ...estimateState,
    projectLocation: {
      ...pl,
      address: normalizeAdvisorLocation(pl.address || ''),
    },
  };
}
