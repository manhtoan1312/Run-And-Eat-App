/**
 * Offline GPS Point Queue
 * =======================
 * Persists GPS points to AsyncStorage so they survive app restarts and network outages.
 * Points are synced to the backend in batches when connectivity is available.
 *
 * Flow:
 *   GPS Update → enqueuePoints() → AsyncStorage (pending)
 *                                        ↓
 *                 syncPendingPoints() ← timer tick / network restore
 *                       ↓
 *                 runApi.addPoints() → Backend
 *                       ↓
 *                 mark 'synced' → auto-cleaned
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { runApi, RunPointInput } from '../api/run';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QueuedPoint {
  id: string;            // unique: `${sessionId}_${recordedAt}`
  sessionId: string;
  point: RunPointInput;
  syncStatus: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  createdAt: number;
}

const QUEUE_KEY = 'run_points_queue';
const MAX_RETRIES = 3;
const BATCH_SIZE = 10;

// ─── Storage helpers ─────────────────────────────────────────────────────────

async function loadQueue(): Promise<QueuedPoint[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedPoint[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[PointQueue] Failed to save queue:', e);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Add GPS points to the persistent queue.
 * Deduplicates by `${sessionId}_${recordedAt}`.
 */
export async function enqueuePoints(sessionId: string, points: RunPointInput[]): Promise<void> {
  const queue = await loadQueue();
  const existingIds = new Set(queue.map(q => q.id));

  let added = 0;
  for (const point of points) {
    const id = `${sessionId}_${point.recordedAt}`;
    if (existingIds.has(id)) continue; // dedup

    queue.push({
      id,
      sessionId,
      point,
      syncStatus: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    });
    added++;
  }

  if (added > 0) {
    await saveQueue(queue);
  }
}

/**
 * Attempt to sync all pending/failed points to the backend.
 * Groups by sessionId and sends in batches of BATCH_SIZE.
 * Returns the number of points successfully synced.
 */
export async function syncPendingPoints(): Promise<number> {
  const queue = await loadQueue();
  const toSync = queue.filter(
    q => (q.syncStatus === 'pending' || q.syncStatus === 'failed') && q.retryCount < MAX_RETRIES
  );

  if (toSync.length === 0) return 0;

  // Group by sessionId
  const grouped: Record<string, QueuedPoint[]> = {};
  for (const item of toSync) {
    if (!grouped[item.sessionId]) grouped[item.sessionId] = [];
    grouped[item.sessionId].push(item);
  }

  let totalSynced = 0;

  for (const [sessionId, items] of Object.entries(grouped)) {
    // Process in batches
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const batchIds = new Set(batch.map(b => b.id));

      // Mark as syncing
      for (const item of batch) {
        item.syncStatus = 'syncing';
      }

      try {
        await runApi.addPoints(sessionId, batch.map(b => b.point));

        // Success: remove synced items from queue
        const updatedQueue = (await loadQueue()).filter(q => !batchIds.has(q.id));
        await saveQueue(updatedQueue);
        totalSynced += batch.length;
      } catch (err: any) {
        const status = err?.response?.status;

        if (status === 400 || status === 404) {
          // Session dead → discard these points entirely
          console.log(`[PointQueue] Session ${sessionId} no longer active, discarding ${batch.length} points`);
          const updatedQueue = (await loadQueue()).filter(q => q.sessionId !== sessionId);
          await saveQueue(updatedQueue);
          break; // skip remaining batches for this session
        } else {
          // Network error → mark failed, increment retry
          console.warn(`[PointQueue] Sync failed for batch, will retry. Error:`, err?.message);
          const currentQueue = await loadQueue();
          for (const item of currentQueue) {
            if (batchIds.has(item.id)) {
              item.syncStatus = 'failed';
              item.retryCount += 1;
            }
          }
          await saveQueue(currentQueue);
        }
      }
    }
  }

  // Cleanup: remove items that exceeded max retries
  const finalQueue = await loadQueue();
  const cleaned = finalQueue.filter(q => q.retryCount < MAX_RETRIES);
  if (cleaned.length !== finalQueue.length) {
    console.log(`[PointQueue] Discarded ${finalQueue.length - cleaned.length} points after max retries`);
    await saveQueue(cleaned);
  }

  return totalSynced;
}

/**
 * Remove all synced/pending points for a specific session.
 * Call on finishRun (after final sync) or cancelRun.
 */
export async function clearSessionPoints(sessionId: string): Promise<void> {
  const queue = await loadQueue();
  const filtered = queue.filter(q => q.sessionId !== sessionId);
  await saveQueue(filtered);
}

/**
 * Get count of pending points (for UI indicators).
 */
export async function getPendingCount(): Promise<number> {
  const queue = await loadQueue();
  return queue.length; // All items in queue are pending/failed (synced ones are removed)
}

/**
 * Quick network check by attempting a lightweight request.
 * Returns true if reachable.
 */
export async function isNetworkAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}
