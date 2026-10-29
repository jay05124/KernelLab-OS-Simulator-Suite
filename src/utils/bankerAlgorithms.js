// Banker's Algorithm utility functions
// Author: Antigravity
// Description: Implements calculation of Need matrix, safety check, request evaluation, and preset generators.

/**
 * Calculate the Need matrix given allocation and max matrices.
 * Need[i][j] = Max[i][j] - Allocation[i][j]
 * @param {number[][]} allocation - Allocation matrix (processes x resources)
 * @param {number[][]} max - Max demand matrix (processes x resources)
 * @returns {number[][]} Need matrix
 */
export function calculateNeed(allocation, max) {
  const need = allocation.map((allocRow, i) =>
    allocRow.map((alloc, j) => max[i][j] - alloc)
  );
  return need;
}

/**
 * Execute the Banker's safety algorithm.
 * @param {number[][]} allocation - Allocation matrix
 * @param {number[][]} max - Max demand matrix
 * @param {number[]} available - Available resources vector
 * @returns {object} safety check result
 */
export function checkSafety(allocation, max, available) {
  const numProcesses = allocation.length;
  const numResources = available.length;
  const need = calculateNeed(allocation, max);

  const work = [...available]; // copy
  const finish = new Array(numProcesses).fill(false);
  const safeSequence = [];
  const steps = [];
  let stepCounter = 1;

  while (true) {
    let progress = false;
    for (let i = 0; i < numProcesses; i++) {
      if (finish[i]) continue;
      // check if need[i] <= work
      const canExecute = need[i].every((n, r) => n <= work[r]);
      // record step info before any execution
      steps.push({
        step: stepCounter,
        process: `P${i}`,
        workBefore: [...work],
        need: [...need[i]],
        canExecute,
        workAfter: null, // to be filled if executed
      });
      stepCounter++;

      if (canExecute) {
        // simulate execution
        for (let r = 0; r < numResources; r++) {
          work[r] += allocation[i][r];
        }
        finish[i] = true;
        safeSequence.push(`P${i}`);
        // update the last step's workAfter
        steps[steps.length - 1].workAfter = [...work];
        progress = true;
        break; // restart scanning from first process
      } else {
        // no execution, keep workAfter null
        steps[steps.length - 1].workAfter = null;
      }
    }
    if (!progress) {
      // No further process can proceed
      break;
    }
  }

  const isSafe = finish.every(Boolean);

  return {
    isSafe,
    safeSequence: isSafe ? safeSequence : [],
    steps,
    needMatrix: need,
  };
}

/**
 * Evaluate a resource request for a specific process.
 * @param {number[][]} allocation - Current allocation matrix
 * @param {number[][]} max - Max demand matrix
 * @param {number[]} available - Available resources vector
 * @param {number} processIdx - Index of the process making the request
 * @param {number[]} requestVector - Requested resources vector
 * @returns {object} evaluation result
 */
export function evaluateRequest(allocation, max, available, processIdx, requestVector) {
  const need = calculateNeed(allocation, max);
  const processNeed = need[processIdx];

  // Check Request <= Need
  for (let r = 0; r < requestVector.length; r++) {
    if (requestVector[r] > processNeed[r]) {
      return {
        canBeGranted: false,
        reason: `Request exceeds process's remaining need for resource ${r}`,
        resultingSafety: null,
      };
    }
  }
  // Check Request <= Available
  for (let r = 0; r < requestVector.length; r++) {
    if (requestVector[r] > available[r]) {
      return {
        canBeGranted: false,
        reason: `Not enough available resources for resource ${r}`,
        resultingSafety: null,
      };
    }
  }

  // Tentatively allocate
  const newAllocation = allocation.map((row) => [...row]);
  const newAvailable = [...available];
  for (let r = 0; r < requestVector.length; r++) {
    newAllocation[processIdx][r] += requestVector[r];
    newAvailable[r] -= requestVector[r];
  }

  const safety = checkSafety(newAllocation, max, newAvailable);
  const canBeGranted = safety.isSafe;
  const reason = canBeGranted
    ? 'Request can be granted safely.'
    : 'Granting the request would lead to an unsafe state.';

  return {
    canBeGranted,
    reason,
    resultingSafety: safety,
  };
}

/**
 * Generate preset data for Banker's Algorithm visualizer.
 * @param {string} presetKey - One of 'safe', 'unsafe', 'random'
 * @returns {{ allocation: number[][], max: number[][], available: number[] }}
 */
export function getBankerPreset(presetKey) {
  if (presetKey === 'safe') {
    const allocation = [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ];
    const max = [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ];
    const available = [3, 3, 2];
    return { allocation, max, available };
  }
  if (presetKey === 'unsafe') {
    const allocation = [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ];
    const max = [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ];
    const available = [0, 0, 0];
    return { allocation, max, available };
  }
  // random preset generation
  const numProcesses = 4;
  const numResources = 3;
  const max = [];
  const allocation = [];
  const available = new Array(numResources).fill(0);
  for (let i = 0; i < numProcesses; i++) {
    const maxRow = [];
    const allocRow = [];
    for (let r = 0; r < numResources; r++) {
      const maxVal = Math.floor(Math.random() * 7) + 1; // 1-7
      const allocVal = Math.floor(Math.random() * (maxVal + 1)); // 0-max
      maxRow.push(maxVal);
      allocRow.push(allocVal);
      available[r] += maxVal - allocVal; // total resources = sum of maxes - allocated
    }
    max.push(maxRow);
    allocation.push(allocRow);
  }
  return { allocation, max, available };
}
