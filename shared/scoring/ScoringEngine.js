/**
 * Pure ScoringEngine — weighted aggregation of ScoreProviders (C.8.2).
 * Deterministic: same context + version → same overall/factors (rounded).
 */
import { getProviderWeights } from './weights.js';
import { listScoreProvidersForType, getScoreProvider } from './providerRegistry.js';

function clampScore(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

/**
 * @param {object} ctx ScoreContext
 * @param {string} scoreType
 * @param {{ version?: string }} [options]
 * @returns {Promise<{ overall: number; factors: object[]; version: string; scoreType: string; ttlMinutes: number }>}
 */
export async function computeScore(ctx, scoreType, options = {}) {
  const { version, ttlMinutes, providers: weightMap } = getProviderWeights(scoreType, options.version);
  const providerIds = Object.keys(weightMap);
  const factors = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const providerId of providerIds) {
    const weight = weightMap[providerId];
    if (!weight || weight <= 0) continue;

    const provider = getScoreProvider(providerId);
    if (!provider) {
      factors.push({
        providerId,
        score: 0,
        weight,
        explanation: `Provider ${providerId} is not registered.`,
        evidence: [],
        improvements: [`Enable provider ${providerId}`],
      });
      continue;
    }

    if (provider.scoreTypes?.length && !provider.scoreTypes.includes(scoreType)) {
      continue;
    }

    const result = await provider.compute(ctx, scoreType);
    const score = clampScore(result?.score);
    factors.push({
      providerId,
      score,
      weight,
      explanation: result?.explanation || '',
      evidence: Array.isArray(result?.evidence) ? result.evidence : [],
      improvements: Array.isArray(result?.improvements) ? result.improvements : [],
    });
    weightedSum += score * weight;
    weightTotal += weight;
  }

  const overall = weightTotal > 0 ? clampScore(weightedSum / weightTotal) : 0;

  return {
    scoreType,
    version,
    overall,
    factors,
    ttlMinutes,
  };
}

/** Sanity helper for verification — ensures registry + weights align for a type. */
export function listExpectedProviders(scoreType, version) {
  const { providers } = getProviderWeights(scoreType, version);
  return Object.keys(providers);
}

export function assertProvidersRegistered(scoreType, version) {
  const ids = listExpectedProviders(scoreType, version);
  const missing = ids.filter((id) => !getScoreProvider(id));
  if (missing.length) {
    throw new Error(`Missing score providers: ${missing.join(', ')}`);
  }
  return listScoreProvidersForType(scoreType);
}
