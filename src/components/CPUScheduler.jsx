import { useState, useEffect, useRef } from 'react'
import {
  Activity,
  ArrowRight,
  ChevronDown,
  Cpu,
  Gauge,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { executeSchedulingAlgorithm, getPresetWorkload } from '../utils/cpuAlgorithms'

export default function CPUScheduler() {
  const [algorithm, setAlgorithm] = useState('FCFS')
  const [quantum, setQuantum] = useState('2')
  const [processes, setProcesses] = useState([])
  const [form, setForm] = useState({ id: 'P1', arrival: '0', burst: '4', priority: '1' })
  const [simulationResult, setSimulationResult] = useState(null)

  // Execution Mode & Interactive State
  const [mode, setMode] = useState('interactive') // 'instant' | 'interactive'
  const [currentTick, setCurrentTick] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 0.5, 1, 2, 4
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false)

  // Timer Ref for Interactive Playback
  const playTimerRef = useRef(null)

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [])

  // Auto-play loop for Interactive Mode
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
      return
    }

    const intervalMs = Math.max(100, Math.floor(1000 / playbackSpeed))
    playTimerRef.current = setInterval(() => {
      setCurrentTick((prev) => {
        const snapshots = simulationResult?.snapshots ?? []
        if (prev < snapshots.length - 1) {
          return prev + 1
        } else {
          setIsPlaying(false)
          return prev
        }
      })
    }, intervalMs)

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current)
        playTimerRef.current = null
      }
    }
  }, [isPlaying, playbackSpeed, simulationResult])

  const addProcess = () => {
    const arrival = Number(form.arrival)
    const burst = Number(form.burst)
    const priority = Number(form.priority)
    const processId = form.id.trim() || `P${processes.length + 1}`

    if (!Number.isFinite(arrival) || arrival < 0 || !Number.isFinite(burst) || burst <= 0 || !Number.isFinite(priority)) {
      return
    }

    const newProcess = {
      id: processId.toUpperCase(),
      arrivalTime: arrival,
      burstTime: burst,
      priority,
    }

    const nextProcesses = [...processes, newProcess]
    setProcesses(nextProcesses)
    resetSimulationState()

    // Automatically suggest next PID and clear/preset fields
    setForm({
      id: `P${nextProcesses.length + 1}`,
      arrival: '',
      burst: '',
      priority: '',
    })
  }

  const deleteProcess = (id) => {
    const nextProcesses = processes.filter((p) => p.id !== id)
    setProcesses(nextProcesses)
    resetSimulationState()
  }

  const clearQueue = () => {
    setProcesses([])
    resetSimulationState()
    setForm((prev) => ({ ...prev, id: 'P1' }))
  }

  const resetSimulationState = () => {
    setSimulationResult(null)
    setIsPlaying(false)
    setCurrentTick(0)
  }

  const handleSelectPreset = (presetKey) => {
    setPresetDropdownOpen(false)
    const loaded = getPresetWorkload(presetKey)
    setProcesses(loaded)
    resetSimulationState()

    if (presetKey === 'convoy') {
      setAlgorithm('FCFS')
    } else if (presetKey === 'starvation') {
      setAlgorithm('Priority')
    } else if (presetKey === 'context_switch') {
      setAlgorithm('Round Robin')
      setQuantum('1')
    }

    setForm((prev) => ({ ...prev, id: `P${loaded.length + 1}` }))
  }

  const runSimulation = () => {
    if (processes.length === 0) return
    const result = executeSchedulingAlgorithm(algorithm, processes, Number(quantum) || 2)
    setSimulationResult(result)
    setIsPlaying(false)
    setCurrentTick(0)
  }

  // Current interactive snapshot
  const snapshots = simulationResult?.snapshots ?? []
  const maxTickIndex = snapshots.length > 0 ? snapshots.length - 1 : 0
  const activeSnapshot = snapshots[currentTick] || (snapshots.length > 0 ? snapshots[0] : null)

  const ganttChart = simulationResult?.ganttChart ?? []
  const processMetrics = simulationResult?.processMetrics ?? []
  const summary = simulationResult?.summary ?? { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0 }
  const totalScheduleSpan = ganttChart.length > 0 ? ganttChart[ganttChart.length - 1].endTime : 0

  return (
    <div className="mx-auto max-w-[1480px] p-5 lg:p-8">
      {/* Top Bar with Title and Preset Dropdown */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300/70">Interactive Simulation Workspace</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-100">CPU Scheduler & Step-by-Step Visualizer</h2>
          <p className="mt-1 text-sm text-slate-500">Simulate, inspect tick-by-tick states, and master operating system process scheduling.</p>
        </div>

        {/* Preset Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-300/40 hover:bg-cyan-300/5 hover:text-cyan-200"
          >
            <Sparkles className="size-3.5 text-cyan-300" />
            <span>Load Preset Workload</span>
            <ChevronDown className="size-3.5 text-slate-400" />
          </button>

          {presetDropdownOpen && (
            <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-white/10 bg-[#0f141d] p-1.5 shadow-2xl backdrop-blur-md">
              <button
                onClick={() => handleSelectPreset('convoy')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">Convoy Effect (FCFS)</div>
                  <div className="text-[10px] text-slate-500">Long P1 blocks small P2, P3, P4</div>
                </div>
              </button>
              <button
                onClick={() => handleSelectPreset('starvation')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">Priority Starvation</div>
                  <div className="text-[10px] text-slate-500">High priority stream delays P1</div>
                </div>
              </button>
              <button
                onClick={() => handleSelectPreset('context_switch')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">High Context Switch (RR)</div>
                  <div className="text-[10px] text-slate-500">Frequent time slicing with Q=1</div>
                </div>
              </button>
              <div className="my-1 border-t border-white/[0.06]" />
              <button
                onClick={() => handleSelectPreset('random')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">🎲 Random Preset</div>
                  <div className="text-[10px] text-slate-500">3 to 6 randomized processes</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Algorithm & Mode Selection Bar */}
      <div className="mb-5 grid gap-3 rounded-xl border border-white/[0.08] bg-[#10151d] p-4 lg:grid-cols-[1fr_180px_auto] lg:items-end">
        <label className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Scheduling algorithm
          <select
            value={algorithm}
            onChange={(event) => {
              setAlgorithm(event.target.value)
              resetSimulationState()
            }}
            className="h-10 rounded-lg border border-white/10 bg-[#0b0f15] px-3 text-sm font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-cyan-300/50"
          >
            <option value="FCFS">FCFS (First-Come, First-Served)</option>
            <option value="SJF">SJF (Shortest Job First)</option>
            <option value="SRTF">SRTF (Shortest Remaining Time First)</option>
            <option value="Priority">Priority Scheduling (Non-preemptive)</option>
            <option value="Round Robin">Round Robin (RR)</option>
          </select>
        </label>

        <label className={`flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] ${algorithm === 'Round Robin' ? 'text-slate-500' : 'text-slate-700'}`}>
          Time quantum
          <input
            type="number"
            min="1"
            value={quantum}
            disabled={algorithm !== 'Round Robin'}
            onChange={(event) => {
              setQuantum(event.target.value)
              resetSimulationState()
            }}
            className="h-10 rounded-lg border border-white/10 bg-[#0b0f15] px-3 text-sm font-normal normal-case tracking-normal text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-40 focus:border-cyan-300/50"
          />
        </label>

        {/* Execution Mode Segmented Control */}
        <div className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Execution Mode
          <div className="flex h-10 items-center rounded-lg border border-white/10 bg-[#0b0f15] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('interactive')
                setIsPlaying(false)
              }}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold normal-case tracking-normal transition-colors ${
                mode === 'interactive'
                  ? 'bg-cyan-300 text-[#071014] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="size-3.5" />
              <span>Interactive Learning</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('instant')
                setIsPlaying(false)
              }}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold normal-case tracking-normal transition-colors ${
                mode === 'instant'
                  ? 'bg-cyan-300 text-[#071014] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="size-3.5" />
              <span>Instant Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workload Inputs */}
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        {/* Add Process Panel */}
        <section className="rounded-xl border border-white/[0.08] bg-[#10151d] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Add Process</h3>
              <p className="mt-1 text-xs text-slate-500">Configure parameters for each process in the workload.</p>
            </div>
            <span className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px] text-slate-500">INPUT</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Process ID" placeholder="P1" value={form.id} onChange={(value) => setForm({ ...form, id: value })} />
            <Field label="Arrival time (AT)" placeholder="0" type="number" value={form.arrival} onChange={(value) => setForm({ ...form, arrival: value })} />
            <Field label="Burst time (BT)" placeholder="4" type="number" value={form.burst} onChange={(value) => setForm({ ...form, burst: value })} />
            <Field label="Priority rank" placeholder="1" type="number" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} />
          </div>
          <button
            onClick={addProcess}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 text-sm font-semibold text-[#071014] transition-colors hover:bg-cyan-200"
          >
            <Plus className="size-4" /> Add Process
          </button>
        </section>

        {/* Process Queue Panel */}
        <section className="min-w-0 rounded-xl border border-white/[0.08] bg-[#10151d] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Configured Workload</h3>
              <p className="mt-1 text-xs text-slate-500">
                {processes.length === 0
                  ? 'Queue is currently empty.'
                  : `${processes.length} ${processes.length === 1 ? 'process' : 'processes'} in queue.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {processes.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300"
                  title="Clear all processes"
                >
                  <Trash2 className="size-3.5" />
                  <span>Clear All</span>
                </button>
              )}
              <span className="font-mono text-xs text-cyan-300">{String(processes.length).padStart(2, '0')}</span>
            </div>
          </div>

          {processes.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-6 text-center">
              <p className="text-xs text-slate-400">
                No processes in workload. Add a process or pick a preset from <span className="text-cyan-300 font-medium">'Load Preset Workload'</span> above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[430px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600">
                    <th className="pb-3 font-medium">PID</th>
                    <th className="pb-3 font-medium">Arrival (AT)</th>
                    <th className="pb-3 font-medium">Burst (BT)</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process) => (
                    <tr key={process.id} className="border-b border-white/[0.05] last:border-0">
                      <td className="py-3 font-mono font-medium text-cyan-200">{process.id}</td>
                      <td className="py-3 font-mono text-slate-400">{process.arrivalTime} ms</td>
                      <td className="py-3 font-mono text-slate-400">{process.burstTime} ms</td>
                      <td className="py-3 font-mono text-slate-400">{process.priority}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => deleteProcess(process.id)}
                          className="rounded-md p-1.5 text-slate-600 hover:bg-rose-400/10 hover:text-rose-300"
                          aria-label={`Delete ${process.id}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Run Action Bar */}
      <div className="my-6 flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#10151d] px-5 py-4">
        <div>
          <p className="text-xs font-semibold text-slate-200">
            {simulationResult !== null
              ? `Simulation active (${algorithm}) - Mode: ${mode === 'interactive' ? 'Interactive Learning' : 'Instant'}`
              : processes.length > 0
              ? `Ready to execute ${algorithm} on ${processes.length} processes.`
              : 'Add processes or select a preset to begin.'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {mode === 'interactive'
              ? 'Interactive Learning Mode generates tick-by-tick state progression with live queues and CPU core animation.'
              : 'Instant Mode immediately provides final Gantt chart and aggregate process metrics.'}
          </p>
        </div>
        <button
          onClick={runSimulation}
          disabled={processes.length === 0}
          className="flex h-10 items-center gap-2 rounded-lg bg-cyan-300 px-6 text-sm font-semibold text-[#071014] shadow-[0_0_24px_rgba(103,232,249,0.15)] transition-all hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <Play className="size-3.5 fill-current" /> Run Simulation
        </button>
      </div>

      {/* Main Simulation View Area */}
      {simulationResult !== null ? (
        mode === 'interactive' ? (
          /* INTERACTIVE LEARNING MODE VIEW */
          <div className="space-y-6">
            {/* Playback Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#10151d] p-4 shadow-lg">
              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPlaying(false)
                    setCurrentTick(0)
                  }}
                  className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                  title="Reset (t=0)"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false)
                    setCurrentTick((t) => Math.max(0, t - 1))
                  }}
                  disabled={currentTick <= 0}
                  className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  title="Step Back (⏮)"
                >
                  <SkipBack className="size-4" />
                </button>
                <button
                  onClick={() => {
                    if (currentTick >= maxTickIndex) {
                      setCurrentTick(0)
                      setIsPlaying(true)
                    } else {
                      setIsPlaying(!isPlaying)
                    }
                  }}
                  className={`flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-semibold transition-colors ${
                    isPlaying
                      ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                      : 'bg-cyan-300 text-[#071014] hover:bg-cyan-200'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="size-3.5 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="size-3.5 fill-current" /> {currentTick >= maxTickIndex ? 'Replay' : 'Play'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false)
                    setCurrentTick((t) => Math.min(maxTickIndex, t + 1))
                  }}
                  disabled={currentTick >= maxTickIndex}
                  className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  title="Step Forward (⏭)"
                >
                  <SkipForward className="size-4" />
                </button>
              </div>

              {/* Digital Clock Display & Progress Scrubber */}
              <div className="flex flex-1 items-center gap-4 min-w-[240px]">
                <div className="flex items-baseline gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 font-mono">
                  <span className="text-[10px] uppercase text-cyan-400/70">Time:</span>
                  <span className="text-base font-bold text-cyan-200">{activeSnapshot?.time ?? 0}</span>
                  <span className="text-xs text-slate-500">/ {snapshots[maxTickIndex]?.time ?? 0} ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxTickIndex}
                  value={currentTick}
                  onChange={(e) => {
                    setIsPlaying(false)
                    setCurrentTick(Number(e.target.value))
                  }}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 accent-cyan-300"
                />
              </div>

              {/* Playback Speed Selector */}
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0b0f15] p-1 text-xs">
                {[0.5, 1, 2, 4].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`rounded px-2 py-1 font-mono text-[11px] transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-cyan-300 font-semibold text-[#071014]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Process State Grid (4 Cards) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* 1. Job Pool (Unarrived: AT > t) */}
              <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#10151d] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📥</span>
                    <h4 className="text-xs font-semibold text-slate-200">Job Pool</h4>
                  </div>
                  <span className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-slate-400">
                    AT &gt; {activeSnapshot?.time ?? 0}
                  </span>
                </div>
                <div className="flex-1 space-y-2 min-h-[140px]">
                  {(!activeSnapshot || activeSnapshot.jobPool.length === 0) ? (
                    <div className="flex h-full items-center justify-center text-[11px] text-slate-600 italic">
                      Empty (All jobs arrived)
                    </div>
                  ) : (
                    activeSnapshot.jobPool.map((p) => (
                      <div
                        key={`job-${p.id}`}
                        className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0b0f15] p-2.5 text-xs"
                      >
                        <span className="font-mono font-semibold text-slate-300">{p.id}</span>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>Arrives: <b className="text-slate-200">{p.arrivalTime}ms</b></span>
                          <span>Burst: {p.burstTime}ms</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. Ready Queue (AT <= t, not running, not terminated) */}
              <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#10151d] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⏳</span>
                    <h4 className="text-xs font-semibold text-cyan-200">Ready Queue</h4>
                  </div>
                  <span className="rounded bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                    {activeSnapshot?.readyQueue.length ?? 0} waiting
                  </span>
                </div>
                <div className="flex-1 space-y-2 min-h-[140px]">
                  {(!activeSnapshot || activeSnapshot.readyQueue.length === 0) ? (
                    <div className="flex h-full items-center justify-center text-[11px] text-slate-600 italic">
                      Queue Empty
                    </div>
                  ) : (
                    activeSnapshot.readyQueue.map((p, idx) => (
                      <div
                        key={`rq-${p.id}-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-400/[0.03] p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-cyan-400/60">#{idx + 1}</span>
                          <span className="font-mono font-semibold text-cyan-200">{p.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Rem: <b className="text-slate-200">{p.remainingBurst}ms</b></span>
                          {algorithm === 'Priority' && <span className="rounded bg-white/5 px-1.5 text-[10px]">P:{p.priority}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. CPU Core */}
              <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#10151d] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <h4 className="text-xs font-semibold text-emerald-300">CPU Core</h4>
                  </div>
                  <span className={`size-2 rounded-full ${activeSnapshot?.runningProcess ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                </div>
                <div className="flex-1 flex flex-col justify-center min-h-[140px]">
                  {activeSnapshot?.runningProcess ? (
                    <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/[0.05] p-3 text-center">
                      <div className="font-mono text-xl font-bold text-emerald-300">
                        {activeSnapshot.runningProcess.id}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Executing at tick {activeSnapshot.time}
                      </p>
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>Remaining Burst</span>
                          <span className="text-emerald-300 font-semibold">{activeSnapshot.runningProcess.remainingBurst} ms</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 transition-all duration-200"
                            style={{
                              width: `${Math.max(10, (activeSnapshot.runningProcess.remainingBurst / activeSnapshot.runningProcess.burstTime) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-6 text-center">
                      <span className="font-mono text-xs font-semibold tracking-wider text-slate-500 uppercase">CPU IDLE</span>
                      <span className="text-[10px] text-slate-600 mt-1">No process scheduled</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Terminated Queue */}
              <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#10151d] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✅</span>
                    <h4 className="text-xs font-semibold text-slate-300">Terminated</h4>
                  </div>
                  <span className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-slate-400">
                    {activeSnapshot?.terminated.length ?? 0} done
                  </span>
                </div>
                <div className="flex-1 space-y-2 min-h-[140px] max-h-[160px] overflow-y-auto pr-1">
                  {(!activeSnapshot || activeSnapshot.terminated.length === 0) ? (
                    <div className="flex h-full items-center justify-center text-[11px] text-slate-600 italic">
                      None terminated yet
                    </div>
                  ) : (
                    activeSnapshot.terminated.map((p) => (
                      <div
                        key={`term-${p.id}`}
                        className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#0b0f15] p-2 text-xs text-slate-400"
                      >
                        <span className="font-mono font-medium text-slate-300">{p.id}</span>
                        <span className="text-[10px] text-emerald-400">Completed</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Live Gantt Chart (Gantt Chart Partial) */}
            <section className="rounded-xl border border-white/[0.08] bg-[#10151d] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">Dynamic Execution Timeline</p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-100">Live Gantt Chart (0 → {activeSnapshot?.time ?? 0} ms)</h3>
                </div>
                <span className="font-mono text-xs text-cyan-300">
                  {currentTick === maxTickIndex ? 'Complete' : 'Simulating...'}
                </span>
              </div>

              <div className="overflow-x-auto pb-4">
                <div className="min-w-[700px]">
                  {activeSnapshot && activeSnapshot.ganttChartPartial.length > 0 ? (
                    <>
                      <div className="mb-2 flex h-14 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b0f15]">
                        {activeSnapshot.ganttChartPartial.map((block, index) => {
                          const duration = block.endTime - block.startTime
                          const widthPct = Math.max((duration / Math.max(totalScheduleSpan, 1)) * 100, 4)
                          const isIdle = block.id === 'IDLE'

                          return (
                            <div
                              key={`live-gantt-${block.id}-${block.startTime}-${index}`}
                              style={{ width: `${widthPct}%` }}
                              className={`flex items-center justify-center border-r border-[#10151d] text-xs font-semibold ${
                                isIdle
                                  ? 'bg-slate-800/40 text-slate-500 italic'
                                  : index % 2 === 0
                                  ? 'bg-cyan-300/20 text-cyan-200'
                                  : 'bg-indigo-300/20 text-indigo-200'
                              }`}
                            >
                              {block.id}
                              <span className="ml-1.5 font-mono text-[10px] opacity-75">
                                {duration}ms
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="relative flex justify-between font-mono text-[10px] text-slate-500 px-0.5">
                        <span>0 ms</span>
                        {activeSnapshot.ganttChartPartial.map((block, index) => (
                          <span key={`time-partial-${block.id}-${index}`}>{block.endTime} ms</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-slate-500">
                      Timeline at start (t = 0 ms). Press Play or Step Forward to run execution.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* INSTANT MODE VIEW */
          <>
            <section className="rounded-xl border border-white/[0.08] bg-[#10151d] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">Static Output</p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-100">Execution timeline (Gantt Chart)</h3>
                </div>
                <span className="rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                  Completed
                </span>
              </div>

              <div className="overflow-x-auto pb-4">
                <div className="min-w-[700px]">
                  {ganttChart.length > 0 ? (
                    <>
                      <div className="mb-2 flex h-14 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b0f15]">
                        {ganttChart.map((block, index) => {
                          const duration = block.endTime - block.startTime
                          const widthPct = Math.max((duration / Math.max(totalScheduleSpan, 1)) * 100, 6)
                          const isIdle = block.id === 'IDLE'

                          return (
                            <div
                              key={`${block.id}-${block.startTime}-${index}`}
                              style={{ width: `${widthPct}%` }}
                              className={`flex items-center justify-center border-r border-[#10151d] text-xs font-semibold ${
                                isIdle
                                  ? 'bg-slate-800/40 text-slate-500 italic'
                                  : index % 2 === 0
                                  ? 'bg-cyan-300/15 text-cyan-200'
                                  : 'bg-indigo-300/15 text-indigo-200'
                              }`}
                            >
                              {block.id}
                              <span className="ml-1.5 font-mono text-[10px] opacity-60">
                                {duration}ms
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="relative flex justify-between font-mono text-[10px] text-slate-500 px-0.5">
                        <span>{ganttChart[0]?.startTime ?? 0} ms</span>
                        {ganttChart.map((block, index) => (
                          <span key={`time-${block.id}-${index}`}>{block.endTime} ms</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-slate-500">
                      No timeline intervals generated.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600">
                      <th className="pb-3 font-medium">PID</th>
                      <th className="pb-3 font-medium">Arrival</th>
                      <th className="pb-3 font-medium">Burst</th>
                      <th className="pb-3 font-medium">Completion</th>
                      <th className="pb-3 font-medium">Turnaround</th>
                      <th className="pb-3 font-medium">Waiting</th>
                      <th className="pb-3 text-right font-medium">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processMetrics.map((result) => (
                      <tr key={`result-${result.id}`} className="border-b border-white/[0.05] last:border-0">
                        <td className="py-3 font-mono font-medium text-cyan-200">{result.id}</td>
                        <td className="py-3 font-mono text-slate-400">{result.arrivalTime}</td>
                        <td className="py-3 font-mono text-slate-400">{result.burstTime}</td>
                        <td className="py-3 font-mono text-slate-300">{result.completionTime}</td>
                        <td className="py-3 font-mono text-slate-300">{result.turnaroundTime}</td>
                        <td className="py-3 font-mono text-slate-300">{result.waitingTime}</td>
                        <td className="py-3 text-right font-mono text-slate-300">{result.responseTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Metric icon={Gauge} label="Average waiting time" value={`${summary.avgWaitingTime} ms`} accent="cyan" />
              <Metric icon={Activity} label="Average turnaround time" value={`${summary.avgTurnaroundTime} ms`} accent="indigo" />
              <Metric icon={Cpu} label="CPU utilization" value={`${summary.cpuUtilization}%`} accent="emerald" />
            </div>
          </>
        )
      ) : (
        <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-[#10151d]/60 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 mb-3">
            <Cpu className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No Active Simulation</h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Select an algorithm and click <span className="text-cyan-300 font-medium">'Run Simulation'</span> to launch the interactive scheduling visualization.
          </p>
        </section>
      )}

      <footer className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5 text-[10px] uppercase tracking-[0.12em] text-slate-600">
        <span>KernelLab Interactive Scheduling Engine</span>
        <span>All times in milliseconds</span>
      </footer>
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text' }) {
  return (
    <label className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
      {label}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-white/10 bg-[#0b0f15] px-3 font-mono text-sm font-normal normal-case tracking-normal text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50"
      />
    </label>
  )
}

function Metric({ icon: Icon, label, value, accent }) {
  const colors = {
    cyan: 'text-cyan-300 bg-cyan-300/10',
    indigo: 'text-indigo-300 bg-indigo-300/10',
    emerald: 'text-emerald-300 bg-emerald-300/10',
  }
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#10151d] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-slate-100">{value}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-lg ${colors[accent]}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${
            accent === 'cyan' ? 'w-[64%] bg-cyan-300' : accent === 'indigo' ? 'w-[76%] bg-indigo-300' : 'w-[92%] bg-emerald-300'
          }`}
        />
      </div>
    </div>
  )
}
