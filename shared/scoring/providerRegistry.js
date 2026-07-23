/**
 * In-memory ScoreProvider registry (C.8.2).
 * Providers are registered at process boot by the ScoringEngine.
 */

const providers = new Map();

export function registerScoreProvider(provider) {
  if (!provider?.id || typeof provider.compute !== 'function') {
    throw new Error('ScoreProvider requires id and compute()');
  }
  providers.set(provider.id, provider);
  return provider;
}

export function getScoreProvider(id) {
  return providers.get(id) || null;
}

export function listScoreProviders() {
  return [...providers.values()];
}

export function listScoreProvidersForType(scoreType) {
  return listScoreProviders().filter((p) => !p.scoreTypes?.length || p.scoreTypes.includes(scoreType));
}

export function clearScoreProviders() {
  providers.clear();
}

export function getScoreProviderCount() {
  return providers.size;
}
