/**
 * Build steps, total seek count, and average seek count from a sequence of head movements
 */
function buildDiskResults(seekSequence) {
  const steps = [];
  let totalSeekCount = 0;

  for (let i = 0; i < seekSequence.length - 1; i++) {
    const from = seekSequence[i];
    const to = seekSequence[i + 1];
    const distance = Math.abs(to - from);
    totalSeekCount += distance;
    steps.push({
      step: i + 1,
      from,
      to,
      distance,
    });
  }

  const avgSeekCount = steps.length > 0 ? (totalSeekCount / steps.length).toFixed(2) : '0.00';

  return {
    seekSequence,
    steps,
    totalSeekCount,
    avgSeekCount,
  };
}

/**
 * 1. FCFS (First-Come, First-Served)
 */
export function fcfs(requests, initialHead) {
  const head = Number(initialHead) || 0;
  const seekSequence = [head, ...requests];
  return buildDiskResults(seekSequence);
}

/**
 * 2. SSTF (Shortest Seek Time First)
 */
export function sstf(requests, initialHead) {
  let currentHead = Number(initialHead) || 0;
  const pending = [...requests];
  const seekSequence = [currentHead];

  while (pending.length > 0) {
    let closestIndex = 0;
    let minDistance = Math.abs(pending[0] - currentHead);

    for (let i = 1; i < pending.length; i++) {
      const dist = Math.abs(pending[i] - currentHead);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    currentHead = pending[closestIndex];
    seekSequence.push(currentHead);
    pending.splice(closestIndex, 1);
  }

  return buildDiskResults(seekSequence);
}

/**
 * 3. SCAN (Elevator Algorithm)
 * Moves toward the boundary in the specified direction, servicing requests, then reverses.
 */
export function scan(requests, initialHead, direction = 'left', diskSize = 200) {
  const head = Number(initialHead) || 0;
  const maxTrack = Math.max(0, (Number(diskSize) || 200) - 1);
  const left = requests.filter((r) => r < head).sort((a, b) => b - a); // descending
  const right = requests.filter((r) => r >= head).sort((a, b) => a - b); // ascending

  const seekSequence = [head];

  if (direction === 'left') {
    // Service to the left down to boundary 0 (if there are left requests or as standard SCAN)
    for (const r of left) {
      seekSequence.push(r);
    }
    // Only hit boundary 0 if there were requests on the left or if required by SCAN
    if (left.length > 0 || right.length > 0) {
      if (seekSequence[seekSequence.length - 1] !== 0) {
        seekSequence.push(0);
      }
    }
    // Reverse to the right
    for (const r of right) {
      seekSequence.push(r);
    }
  } else {
    // Direction right
    for (const r of right) {
      seekSequence.push(r);
    }
    if (right.length > 0 || left.length > 0) {
      if (seekSequence[seekSequence.length - 1] !== maxTrack) {
        seekSequence.push(maxTrack);
      }
    }
    for (const r of left) {
      seekSequence.push(r);
    }
  }

  return buildDiskResults(seekSequence);
}

/**
 * 4. C-SCAN (Circular SCAN)
 * Moves toward one end servicing requests, jumps directly to the opposite end without servicing, then continues.
 */
export function cscan(requests, initialHead, direction = 'right', diskSize = 200) {
  const head = Number(initialHead) || 0;
  const maxTrack = Math.max(0, (Number(diskSize) || 200) - 1);
  const left = requests.filter((r) => r < head).sort((a, b) => a - b); // ascending
  const right = requests.filter((r) => r >= head).sort((a, b) => a - b); // ascending

  const seekSequence = [head];

  if (direction === 'right') {
    // Service right
    for (const r of right) {
      seekSequence.push(r);
    }
    // Reach max boundary
    if (seekSequence[seekSequence.length - 1] !== maxTrack) {
      seekSequence.push(maxTrack);
    }
    // Wrap to 0
    seekSequence.push(0);
    // Continue right servicing left requests
    for (const r of left) {
      seekSequence.push(r);
    }
  } else {
    // Direction left
    const leftDesc = requests.filter((r) => r < head).sort((a, b) => b - a);
    const rightDesc = requests.filter((r) => r >= head).sort((a, b) => b - a);

    for (const r of leftDesc) {
      seekSequence.push(r);
    }
    if (seekSequence[seekSequence.length - 1] !== 0) {
      seekSequence.push(0);
    }
    seekSequence.push(maxTrack);
    for (const r of rightDesc) {
      seekSequence.push(r);
    }
  }

  return buildDiskResults(seekSequence);
}

/**
 * 5. LOOK
 * Like SCAN, but only goes as far as the furthest request in the current direction before reversing.
 */
export function look(requests, initialHead, direction = 'left') {
  const head = Number(initialHead) || 0;
  const left = requests.filter((r) => r < head).sort((a, b) => b - a); // descending
  const right = requests.filter((r) => r >= head).sort((a, b) => a - b); // ascending

  const seekSequence = [head];

  if (direction === 'left') {
    for (const r of left) {
      seekSequence.push(r);
    }
    for (const r of right) {
      seekSequence.push(r);
    }
  } else {
    for (const r of right) {
      seekSequence.push(r);
    }
    for (const r of left) {
      seekSequence.push(r);
    }
  }

  return buildDiskResults(seekSequence);
}

/**
 * 6. C-LOOK (Circular LOOK)
 * Like C-SCAN, but only jumps between the furthest requests at both ends without traveling to 0 or maxTrack.
 */
export function clook(requests, initialHead, direction = 'right') {
  const head = Number(initialHead) || 0;
  const seekSequence = [head];

  if (direction === 'right') {
    const right = requests.filter((r) => r >= head).sort((a, b) => a - b);
    const left = requests.filter((r) => r < head).sort((a, b) => a - b);

    for (const r of right) {
      seekSequence.push(r);
    }
    for (const r of left) {
      seekSequence.push(r);
    }
  } else {
    const left = requests.filter((r) => r < head).sort((a, b) => b - a);
    const right = requests.filter((r) => r >= head).sort((a, b) => b - a);

    for (const r of left) {
      seekSequence.push(r);
    }
    for (const r of right) {
      seekSequence.push(r);
    }
  }

  return buildDiskResults(seekSequence);
}

/**
 * Unified Algorithm Dispatcher
 */
export function executeDiskAlgorithm(algorithm, requests, initialHead, direction = 'left', diskSize = 200) {
  const validRequests = (requests || []).map((r) => Math.max(0, Math.min((diskSize || 200) - 1, Number(r))));
  const head = Math.max(0, Math.min((diskSize || 200) - 1, Number(initialHead) || 0));

  switch (algorithm) {
    case 'FCFS':
      return fcfs(validRequests, head, diskSize);
    case 'SSTF':
      return sstf(validRequests, head, diskSize);
    case 'SCAN':
      return scan(validRequests, head, direction, diskSize);
    case 'C-SCAN':
      return cscan(validRequests, head, direction, diskSize);
    case 'LOOK':
      return look(validRequests, head, direction, diskSize);
    case 'C-LOOK':
      return clook(validRequests, head, direction, diskSize);
    default:
      return fcfs(validRequests, head, diskSize);
  }
}

/**
 * Preset Workloads Generator
 */
export function getDiskPreset(presetKey) {
  switch (presetKey) {
    case 'textbook':
      return {
        name: 'Standard Textbook',
        requests: [98, 183, 37, 122, 14, 124, 65, 67],
        head: 53,
        diskSize: 200,
        direction: 'left',
        algorithm: 'SCAN',
      };
    case 'starvation':
      return {
        name: 'SSTF Starvation',
        requests: [50, 52, 54, 190, 51, 53, 195],
        head: 50,
        diskSize: 200,
        direction: 'right',
        algorithm: 'SSTF',
      };
    case 'boundary':
      return {
        name: 'Boundary Oscillations',
        requests: [10, 180, 20, 170, 30],
        head: 50,
        diskSize: 200,
        direction: 'right',
        algorithm: 'C-SCAN',
      };
    case 'random': {
      const count = 8;
      const randRequests = Array.from({ length: count }, () => Math.floor(Math.random() * 200));
      return {
        name: 'Randomized Workload',
        requests: randRequests,
        head: 50,
        diskSize: 200,
        direction: 'right',
        algorithm: 'FCFS',
      };
    }
    default:
      return {
        name: 'Default',
        requests: [98, 183, 37, 122, 14, 124, 65, 67],
        head: 53,
        diskSize: 200,
        direction: 'left',
        algorithm: 'FCFS',
      };
  }
}
