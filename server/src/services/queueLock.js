/**
 * Distributed lock for queue processing (C.7.0.9).
 */
import { getRedisClient } from '../config/redis.js';

const LOCK_KEY = 'edurozgaar:queue:process-lock';
const LOCK_TTL_SEC = 55;

let memoryLock = false;

export async function acquireQueueLock() {
  const redis = await getRedisClient();
  if (redis) {
    const token = `${process.pid}:${Date.now()}`;
    const ok = await redis.set(LOCK_KEY, token, 'EX', LOCK_TTL_SEC, 'NX');
    return ok === 'OK';
  }
  if (memoryLock) return false;
  memoryLock = true;
  return true;
}

export async function releaseQueueLock() {
  const redis = await getRedisClient();
  if (redis) {
    await redis.del(LOCK_KEY);
  } else {
    memoryLock = false;
  }
}
