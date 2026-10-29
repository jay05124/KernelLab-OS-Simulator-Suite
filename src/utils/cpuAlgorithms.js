/**
 * Helper to compute summary and process metrics
 * Processes have: id, arrivalTime, burstTime, priority
 */
function buildResults(processes, ganttChart, snapshots = []) {
  // Sort processes by arrival time or original order
  const processMetrics = processes.map((proc) => {
    const blocks = ganttChart.filter((b) => b.id === proc.id);
    if (blocks.length === 0) {
      return {
        id: proc.id,
        arrivalTime: proc.arrivalTime,
        burstTime: proc.burstTime,
        priority: proc.priority,
        completionTime: 0,
        turnaroundTime: 0,
        waitingTime: 0,
        responseTime: 0,
      };
    }

    const firstBlock = blocks[0];
    const lastBlock = blocks[blocks.length - 1];

    const completionTime = lastBlock.endTime;
    const turnaroundTime = completionTime - proc.arrivalTime;
    const waitingTime = turnaroundTime - proc.burstTime;
    const responseTime = firstBlock.startTime - proc.arrivalTime;

    return {
      id: proc.id,
      arrivalTime: proc.arrivalTime,
      burstTime: proc.burstTime,
      priority: proc.priority,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    };
  });

  const totalWaitingTime = processMetrics.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalTurnaroundTime = processMetrics.reduce((sum, p) => sum + p.turnaroundTime, 0);
  const totalBurstTime = processes.reduce((sum, p) => sum + p.burstTime, 0);
  const totalTime = ganttChart.length > 0 ? ganttChart[ganttChart.length - 1].endTime : 0;

  const avgWaitingTime = processMetrics.length > 0 ? Number((totalWaitingTime / processMetrics.length).toFixed(2)) : 0;
  const avgTurnaroundTime = processMetrics.length > 0 ? Number((totalTurnaroundTime / processMetrics.length).toFixed(2)) : 0;
  
  // CPU utilization: active burst time / total schedule span
  const cpuUtilization = totalTime > 0 ? Number(((totalBurstTime / totalTime) * 100).toFixed(2)) : 0;

  return {
    ganttChart,
    processMetrics,
    summary: {
      avgWaitingTime,
      avgTurnaroundTime,
      cpuUtilization,
    },
    snapshots,
  };
}

/**
 * Merges consecutive blocks for the same process if any
 */
function mergeGanttBlocks(blocks) {
  if (!blocks || blocks.length === 0) return [];
  const merged = [blocks[0]];
  for (let i = 1; i < blocks.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = blocks[i];
    if (prev.id === curr.id && prev.endTime === curr.startTime) {
      prev.endTime = curr.endTime;
    } else {
      merged.push({ ...curr });
    }
  }
  return merged;
}

/**
 * Helper to build partial gantt chart up to time t from 1-unit execution timeline
 */
function buildGanttPartial(timeline, t) {
  if (t === 0 || !timeline || timeline.length === 0) return [];
  const activeTimeline = timeline.slice(0, t);
  const blocks = [];
  let currentBlock = null;

  for (let i = 0; i < activeTimeline.length; i++) {
    const id = activeTimeline[i];
    if (!currentBlock) {
      currentBlock = { id, startTime: i, endTime: i + 1 };
    } else if (currentBlock.id === id) {
      currentBlock.endTime = i + 1;
    } else {
      blocks.push(currentBlock);
      currentBlock = { id, startTime: i, endTime: i + 1 };
    }
  }
  if (currentBlock) {
    blocks.push(currentBlock);
  }
  return blocks;
}

/**
 * 1. FCFS (First-Come, First-Served) - Non-preemptive
 */
export function fcfs(processes) {
  if (!processes || processes.length === 0) {
    return { ganttChart: [], processMetrics: [], summary: { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0 }, snapshots: [] };
  }

  // Work on deep copies
  const procs = processes.map((p, idx) => ({
    id: p.id,
    arrivalTime: p.arrivalTime,
    burstTime: p.burstTime,
    priority: p.priority,
    originalIndex: idx,
    remainingBurst: p.burstTime,
  }));

  const totalBurst = procs.reduce((sum, p) => sum + p.burstTime, 0);
  let t = 0;
  let running = null;
  const readyQueue = [];
  const terminated = [];
  const snapshots = [];
  const timeline = []; // timeline[t] is the process id executed during [t, t+1)

  // We loop tick by tick until all processes are terminated
  while (terminated.length < procs.length) {
    // 1. Identify newly arrived processes at time t (who haven't been in readyQueue or running or terminated)
    // In FCFS, sort newly arrived by arrivalTime then originalIndex
    const justArrived = procs.filter(
      (p) => p.arrivalTime === t && !readyQueue.some((q) => q.id === p.id) && (!running || running.id !== p.id) && !terminated.some((term) => term.id === p.id)
    ).sort((a, b) => a.arrivalTime - b.arrivalTime || a.originalIndex - b.originalIndex);

    readyQueue.push(...justArrived);

    // If no process is currently running, pull the next from readyQueue
    if (!running && readyQueue.length > 0) {
      running = readyQueue.shift();
    }

    // Capture snapshot at time t (state at start of tick t)
    const jobPool = procs
      .filter((p) => p.arrivalTime > t)
      .map((p) => ({ ...p }));
    const readySnap = readyQueue.map((p) => ({ ...p }));
    const runningSnap = running ? { ...running } : null;
    const termSnap = terminated.map((p) => ({ ...p }));
    const ganttChartPartial = buildGanttPartial(timeline, t);

    snapshots.push({
      time: t,
      jobPool,
      readyQueue: readySnap,
      runningProcess: runningSnap,
      terminated: termSnap,
      ganttChartPartial,
    });

    // CPU tick execution [t, t+1)
    if (running) {
      timeline.push(running.id);
      running.remainingBurst -= 1;
      if (running.remainingBurst === 0) {
        terminated.push({ ...running, remainingBurst: 0 });
        running = null;
      }
    } else {
      timeline.push('IDLE');
    }

    t++;
  }

  // Capture final snapshot at T_final (all processes terminated, running is null, readyQueue empty)
  snapshots.push({
    time: t,
    jobPool: [],
    readyQueue: [],
    runningProcess: null,
    terminated: terminated.map((p) => ({ ...p })),
    ganttChartPartial: buildGanttPartial(timeline, t),
  });

  const ganttChart = buildGanttPartial(timeline, t);
  return buildResults(processes, ganttChart, snapshots);
}

/**
 * 2. SJF (Shortest Job First) - Non-preemptive
 */
export function sjf(processes) {
  if (!processes || processes.length === 0) {
    return { ganttChart: [], processMetrics: [], summary: { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0 }, snapshots: [] };
  }

  const procs = processes.map((p, idx) => ({
    id: p.id,
    arrivalTime: p.arrivalTime,
    burstTime: p.burstTime,
    priority: p.priority,
    originalIndex: idx,
    remainingBurst: p.burstTime,
  }));

  let t = 0;
  let running = null;
  const readyQueue = [];
  const terminated = [];
  const snapshots = [];
  const timeline = [];

  while (terminated.length < procs.length) {
    const justArrived = procs.filter(
      (p) => p.arrivalTime === t && !readyQueue.some((q) => q.id === p.id) && (!running || running.id !== p.id) && !terminated.some((term) => term.id === p.id)
    );

    readyQueue.push(...justArrived);

    // If no running process, select shortest burstTime from readyQueue
    if (!running && readyQueue.length > 0) {
      readyQueue.sort(
        (a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || a.originalIndex - b.originalIndex
      );
      running = readyQueue.shift();
    }

    const jobPool = procs.filter((p) => p.arrivalTime > t).map((p) => ({ ...p }));
    const readySnap = readyQueue.map((p) => ({ ...p }));
    const runningSnap = running ? { ...running } : null;
    const termSnap = terminated.map((p) => ({ ...p }));
    const ganttChartPartial = buildGanttPartial(timeline, t);

    snapshots.push({
      time: t,
      jobPool,
      readyQueue: readySnap,
      runningProcess: runningSnap,
      terminated: termSnap,
      ganttChartPartial,
    });

    if (running) {
      timeline.push(running.id);
      running.remainingBurst -= 1;
      if (running.remainingBurst === 0) {
        terminated.push({ ...running, remainingBurst: 0 });
        running = null;
      }
    } else {
      timeline.push('IDLE');
    }

    t++;
  }

  snapshots.push({
    time: t,
    jobPool: [],
    readyQueue: [],
    runningProcess: null,
    terminated: terminated.map((p) => ({ ...p })),
    ganttChartPartial: buildGanttPartial(timeline, t),
  });

  const ganttChart = buildGanttPartial(timeline, t);
  return buildResults(processes, ganttChart, snapshots);
}

/**
 * 3. SRTF (Shortest Remaining Time First) - Preemptive
 */
export function srtf(processes) {
  if (!processes || processes.length === 0) {
    return { ganttChart: [], processMetrics: [], summary: { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0 }, snapshots: [] };
  }

  const procs = processes.map((p, idx) => ({
    id: p.id,
    arrivalTime: p.arrivalTime,
    burstTime: p.burstTime,
    priority: p.priority,
    originalIndex: idx,
    remainingBurst: p.burstTime,
  }));

  let t = 0;
  let running = null;
  const readyQueue = [];
  const terminated = [];
  const snapshots = [];
  const timeline = [];

  while (terminated.length < procs.length) {
    const justArrived = procs.filter(
      (p) => p.arrivalTime === t && !readyQueue.some((q) => q.id === p.id) && (!running || running.id !== p.id) && !terminated.some((term) => term.id === p.id)
    );
    readyQueue.push(...justArrived);

    // Preemption check: if running, put back into ready pool to re-evaluate shortest remainingBurst
    const candidatePool = [...readyQueue];
    if (running) {
      candidatePool.push(running);
    }

    if (candidatePool.length > 0) {
      candidatePool.sort(
        (a, b) => a.remainingBurst - b.remainingBurst || a.arrivalTime - b.arrivalTime || a.originalIndex - b.originalIndex
      );
      running = candidatePool[0];
      // Remaining go to readyQueue
      readyQueue.length = 0;
      for (let i = 1; i < candidatePool.length; i++) {
        readyQueue.push(candidatePool[i]);
      }
    }

    const jobPool = procs.filter((p) => p.arrivalTime > t).map((p) => ({ ...p }));
    const readySnap = readyQueue.map((p) => ({ ...p }));
    const runningSnap = running ? { ...running } : null;
    const termSnap = terminated.map((p) => ({ ...p }));
    const ganttChartPartial = buildGanttPartial(timeline, t);

    snapshots.push({
      time: t,
      jobPool,
      readyQueue: readySnap,
      runningProcess: runningSnap,
      terminated: termSnap,
      ganttChartPartial,
    });

    if (running) {
      timeline.push(running.id);
      running.remainingBurst -= 1;
      if (running.remainingBurst === 0) {
        terminated.push({ ...running, remainingBurst: 0 });
        running = null;
      }
    } else {
      timeline.push('IDLE');
    }

    t++;
  }

  snapshots.push({
    time: t,
    jobPool: [],
    readyQueue: [],
    runningProcess: null,
    terminated: terminated.map((p) => ({ ...p })),
    ganttChartPartial: buildGanttPartial(timeline, t),
  });

  const ganttChart = buildGanttPartial(timeline, t);
  return buildResults(processes, ganttChart, snapshots);
}

/**
 * 4. Priority (Non-preemptive, lower number = higher priority)
 */
export function priorityScheduling(processes) {
  if (!processes || processes.length === 0) {
    return { ganttChart: [], processMetrics: [], summary: { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0 }, snapshots: [] };
  }

  const procs = processes.map((p, idx) => ({
    id: p.id,
    arrivalTime: p.arrivalTime,
    burstTime: p.burstTime,
    priority: p.priority,
    originalIndex: idx,
    remainingBurst: p.burstTime,
  }));

  let t = 0;
  let running = null;
  const readyQueue = [];
  const terminated = [];
  const snapshots = [];
  const timeline = [];

  while (terminated.length < procs.length) {
    const justArrived = procs.filter(
      (p) => p.arrivalTime === t && !readyQueue.some((q) => q.id === p.id) && (!running || running.id !== p.id) && !terminated.some((term) => term.id === p.id)
    );
    readyQueue.push(...justArrived);

    if (!running && readyQueue.length > 0) {
      // Lower numerical value = higher priority
      readyQueue.sort(
        (a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.originalIndex - b.originalIndex
      );
      running = readyQueue.shift();
    }

    const jobPool = procs.filter((p) => p.arrivalTime > t).map((p) => ({ ...p }));
    const readySnap = readyQueue.map((p) => ({ ...p }));
    const runningSnap = running ? { ...running } : null;
    const termSnap = terminated.map((p) => ({ ...p }));
    const ganttChartPartial = buildGanttPartial(timeline, t);

    snapshots.push({
      time: t,
      jobPool,
      readyQueue: readySnap,
      runningProcess: runningSnap,
      terminated: termSnap,
      ganttChartPartial,
    });

    if (running) {
      timeline.push(running.id);
      running.remainingBurst -= 1;
      if (running.remainingBurst === 0) {
        terminated.push({ ...running, remainingBurst: 0 });
        running = null;
      }
    } else {
      timeline.push('IDLE');
    }

    t++;
  }

  snapshots.push({
    time: t,
    jobPool: [],
    readyQueue: [],
    runningProcess: null,
    terminated: terminated.map((p) => ({ ...p })),
    ganttChartPartial: buildGanttPartial(timeline, t),
  });

  const ganttChart = buildGanttPartial(timeline, t);
  return buildResults(processes, ganttChart, snapshots);
}

/**
 * 5. Round Robin (Preemptive with custom Time Quantum)
 */
export function roundRobin(processes, timeQuantum = 2) {
  if (!processes || processes.length === 0) {
    return { ganttChart: [], processMetrics: [], summary: { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0 }, snapshots: [] };
  }

  const q = Number(timeQuantum) > 0 ? Number(timeQuantum) : 2;
  const procs = processes.map((p, idx) => ({
    id: p.id,
    arrivalTime: p.arrivalTime,
    burstTime: p.burstTime,
    priority: p.priority,
    originalIndex: idx,
    remainingBurst: p.burstTime,
  }));

  let t = 0;
  let running = null;
  let currentQuantumSpent = 0;
  const readyQueue = [];
  const terminated = [];
  const snapshots = [];
  const timeline = [];

  while (terminated.length < procs.length) {
    // 1. Check arrivals at time t
    const justArrived = procs
      .filter((p) => p.arrivalTime === t)
      .sort((a, b) => a.originalIndex - b.originalIndex);

    for (const p of justArrived) {
      readyQueue.push(p);
    }

    // 2. If running process completed its quantum at end of previous tick (which happens when currentQuantumSpent === q),
    // it was already identified or needs to rotate now.
    // To handle clean tick-by-tick RR:
    // If not running, pick from readyQueue
    if (!running && readyQueue.length > 0) {
      running = readyQueue.shift();
      currentQuantumSpent = 0;
    }

    const jobPool = procs.filter((p) => p.arrivalTime > t).map((p) => ({ ...p }));
    const readySnap = readyQueue.map((p) => ({ ...p }));
    const runningSnap = running ? { ...running } : null;
    const termSnap = terminated.map((p) => ({ ...p }));
    const ganttChartPartial = buildGanttPartial(timeline, t);

    snapshots.push({
      time: t,
      jobPool,
      readyQueue: readySnap,
      runningProcess: runningSnap,
      terminated: termSnap,
      ganttChartPartial,
    });

    if (running) {
      timeline.push(running.id);
      running.remainingBurst -= 1;
      currentQuantumSpent += 1;

      if (running.remainingBurst === 0) {
        terminated.push({ ...running, remainingBurst: 0 });
        running = null;
        currentQuantumSpent = 0;
      } else if (currentQuantumSpent === q) {
        // Quantum expired! It will yield.
        // Any process arriving at t + 1 should arrive, then this process gets re-added or this process gets re-added now.
        // Standard RR convention: processes arriving at t+1 enter readyQueue before the preempted process is requeued.
        // Let's check arrivals at t + 1 first:
        const nextArrived = procs
          .filter((p) => p.arrivalTime === t + 1)
          .sort((a, b) => a.originalIndex - b.originalIndex);
        for (const na of nextArrived) {
          readyQueue.push(na);
        }
        readyQueue.push(running);
        running = null;
        currentQuantumSpent = 0;
      }
    } else {
      timeline.push('IDLE');
    }

    t++;
  }

  snapshots.push({
    time: t,
    jobPool: [],
    readyQueue: [],
    runningProcess: null,
    terminated: terminated.map((p) => ({ ...p })),
    ganttChartPartial: buildGanttPartial(timeline, t),
  });

  const ganttChart = buildGanttPartial(timeline, t);
  return buildResults(processes, ganttChart, snapshots);
}

/**
 * Preset workloads generator
 */
export function getPresetWorkload(presetKey) {
  switch (presetKey) {
    case 'convoy':
      return [
        { id: 'P1', arrivalTime: 0, burstTime: 20, priority: 3 },
        { id: 'P2', arrivalTime: 1, burstTime: 2, priority: 1 },
        { id: 'P3', arrivalTime: 2, burstTime: 2, priority: 2 },
        { id: 'P4', arrivalTime: 3, burstTime: 1, priority: 1 },
      ];
    case 'starvation':
      return [
        { id: 'P1', arrivalTime: 0, burstTime: 15, priority: 5 },
        { id: 'P2', arrivalTime: 1, burstTime: 2, priority: 1 },
        { id: 'P3', arrivalTime: 3, burstTime: 2, priority: 1 },
        { id: 'P4', arrivalTime: 5, burstTime: 3, priority: 1 },
        { id: 'P5', arrivalTime: 7, burstTime: 2, priority: 1 },
      ];
    case 'context_switch':
      return [
        { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 1 },
        { id: 'P2', arrivalTime: 0, burstTime: 7, priority: 1 },
        { id: 'P3', arrivalTime: 1, burstTime: 6, priority: 1 },
      ];
    case 'random': {
      // Generates 3 to 6 processes.
      // Arrival time: random integer between 0 and 8.
      // Burst time: random integer between 1 and 12.
      // Priority: random integer between 1 and 5.
      const count = Math.floor(Math.random() * 4) + 3; // 3 to 6
      const result = [];
      for (let i = 1; i <= count; i++) {
        result.push({
          id: `P${i}`,
          arrivalTime: Math.floor(Math.random() * 9), // 0 to 8
          burstTime: Math.floor(Math.random() * 12) + 1, // 1 to 12
          priority: Math.floor(Math.random() * 5) + 1, // 1 to 5
        });
      }
      return result;
    }
    default:
      return [
        { id: 'P1', arrivalTime: 0, burstTime: 4, priority: 1 },
      ];
  }
}

/**
 * Unified dispatch function
 */
export function executeSchedulingAlgorithm(algorithm, processes, timeQuantum = 2) {
  switch (algorithm) {
    case 'FCFS':
      return fcfs(processes);
    case 'SJF':
      return sjf(processes);
    case 'SRTF':
      return srtf(processes);
    case 'Priority':
      return priorityScheduling(processes);
    case 'Round Robin':
      return roundRobin(processes, timeQuantum);
    default:
      return fcfs(processes);
  }
}
