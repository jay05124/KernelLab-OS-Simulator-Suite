/**
 * Helper to build summary stats
 */
function buildSummary(steps, totalPages) {
  const totalFaults = steps.length > 0 ? steps[steps.length - 1].faultCount : 0;
  const totalHits = steps.length > 0 ? steps[steps.length - 1].hitCount : 0;
  const hitRatio = totalPages > 0 ? Number(((totalHits / totalPages) * 100).toFixed(2)) : 0;

  return {
    totalFaults,
    totalHits,
    hitRatio,
  };
}

/**
 * 1. FIFO (First-In, First-Out)
 * Evicts the page that has been in memory the longest.
 */
export function fifo(referenceString, frameCount) {
  const frames = Array(frameCount).fill(null);
  const queue = []; // Stores indices or pages in arrival order
  const steps = [];
  let faultCount = 0;
  let hitCount = 0;

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i];
    const hitIndex = frames.indexOf(page);

    if (hitIndex !== -1) {
      // Hit!
      hitCount++;
      steps.push({
        page,
        frames: [...frames],
        isFault: false,
        faultCount,
        hitCount,
      });
    } else {
      // Fault!
      faultCount++;
      const emptySlot = frames.indexOf(null);

      if (emptySlot !== -1) {
        frames[emptySlot] = page;
        queue.push(emptySlot);
      } else {
        // Evict oldest slot
        const evictSlot = queue.shift();
        frames[evictSlot] = page;
        queue.push(evictSlot);
      }

      steps.push({
        page,
        frames: [...frames],
        isFault: true,
        faultCount,
        hitCount,
      });
    }
  }

  return {
    steps,
    summary: buildSummary(steps, referenceString.length),
  };
}

/**
 * 2. LRU (Least Recently Used)
 * Evicts the page that hasn't been accessed for the longest time.
 */
export function lru(referenceString, frameCount) {
  const frames = Array(frameCount).fill(null);
  const lastUsed = new Map(); // page -> last accessed time (index)
  const steps = [];
  let faultCount = 0;
  let hitCount = 0;

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i];
    const hitIndex = frames.indexOf(page);

    if (hitIndex !== -1) {
      hitCount++;
      lastUsed.set(page, i);
      steps.push({
        page,
        frames: [...frames],
        isFault: false,
        faultCount,
        hitCount,
      });
    } else {
      faultCount++;
      const emptySlot = frames.indexOf(null);

      if (emptySlot !== -1) {
        frames[emptySlot] = page;
      } else {
        // Find page in frames with minimum lastUsed index
        let lruSlot = 0;
        let minAccess = Infinity;
        for (let slot = 0; slot < frameCount; slot++) {
          const p = frames[slot];
          const accessTime = lastUsed.get(p) ?? -1;
          if (accessTime < minAccess) {
            minAccess = accessTime;
            lruSlot = slot;
          }
        }
        frames[lruSlot] = page;
      }

      lastUsed.set(page, i);
      steps.push({
        page,
        frames: [...frames],
        isFault: true,
        faultCount,
        hitCount,
      });
    }
  }

  return {
    steps,
    summary: buildSummary(steps, referenceString.length),
  };
}

/**
 * 3. Optimal (OPT / Belady's Min)
 * Evicts the page that will not be used for the longest period of time in the future.
 */
export function optimal(referenceString, frameCount) {
  const frames = Array(frameCount).fill(null);
  const steps = [];
  let faultCount = 0;
  let hitCount = 0;

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i];
    const hitIndex = frames.indexOf(page);

    if (hitIndex !== -1) {
      hitCount++;
      steps.push({
        page,
        frames: [...frames],
        isFault: false,
        faultCount,
        hitCount,
      });
    } else {
      faultCount++;
      const emptySlot = frames.indexOf(null);

      if (emptySlot !== -1) {
        frames[emptySlot] = page;
      } else {
        // Find page in frames with furthest next use
        let victimSlot = 0;
        let furthestNextUse = -1;

        for (let slot = 0; slot < frameCount; slot++) {
          const p = frames[slot];
          let nextUse = Infinity;

          for (let futureIdx = i + 1; futureIdx < referenceString.length; futureIdx++) {
            if (referenceString[futureIdx] === p) {
              nextUse = futureIdx;
              break;
            }
          }

          if (nextUse === Infinity) {
            // This page is never used again, ideal victim
            victimSlot = slot;
            break;
          }

          if (nextUse > furthestNextUse) {
            furthestNextUse = nextUse;
            victimSlot = slot;
          }
        }

        frames[victimSlot] = page;
      }

      steps.push({
        page,
        frames: [...frames],
        isFault: true,
        faultCount,
        hitCount,
      });
    }
  }

  return {
    steps,
    summary: buildSummary(steps, referenceString.length),
  };
}

/**
 * Unified algorithm runner
 */
export function executePageAlgorithm(algorithm, referenceString, frameCount) {
  const validFrames = Math.max(1, Math.min(7, Number(frameCount) || 3));
  switch (algorithm) {
    case 'FIFO':
      return fifo(referenceString, validFrames);
    case 'LRU':
      return lru(referenceString, validFrames);
    case 'Optimal':
      return optimal(referenceString, validFrames);
    default:
      return fifo(referenceString, validFrames);
  }
}

/**
 * Presets generator helper
 */
export function getPagePreset(presetKey) {
  switch (presetKey) {
    case 'belady':
      return {
        name: "Belady's Anomaly",
        referenceString: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
        frames: 3,
        algorithm: 'FIFO',
      };
    case 'lru_classic':
      return {
        name: 'Classic LRU Test',
        referenceString: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
        frames: 3,
        algorithm: 'LRU',
      };
    case 'random': {
      // 15 random pages between 0 and 9
      const randPages = Array.from({ length: 15 }, () => Math.floor(Math.random() * 10));
      return {
        name: 'Random String',
        referenceString: randPages,
        frames: 3,
        algorithm: 'FIFO',
      };
    }
    default:
      return {
        name: 'Default',
        referenceString: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3],
        frames: 3,
        algorithm: 'FIFO',
      };
  }
}
