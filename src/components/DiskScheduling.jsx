import { useState, useMemo } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Compass,
  Gauge,
  HardDrive,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react'
import { executeDiskAlgorithm, getDiskPreset } from '../utils/diskAlgorithms'

export default function DiskScheduling() {
  const [requestsInput, setRequestsInput] = useState('98, 183, 37, 122, 14, 124, 65, 67')
  const [initialHead, setInitialHead] = useState(53)
  const [diskSize, setDiskSize] = useState(200)
  const [direction, setDirection] = useState('left') // 'left' | 'right'
  const [algorithm, setAlgorithm] = useState('SCAN')
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false)
  const [simulationResult, setSimulationResult] = useState(null)

  // Parse requests into integer array
  const parsedRequests = useMemo(() => {
    const maxVal = Math.max(1, Number(diskSize) || 200) - 1
    return requestsInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !isNaN(Number(s)))
      .map((s) => Math.max(0, Math.min(maxVal, parseInt(s, 10))))
  }, [requestsInput, diskSize])

  const handleRun = () => {
    if (parsedRequests.length === 0) return
    const result = executeDiskAlgorithm(algorithm, parsedRequests, Number(initialHead) || 0, direction, Number(diskSize) || 200)
    setSimulationResult(result)
  }

  const handleSelectPreset = (presetKey) => {
    setPresetDropdownOpen(false)
    const preset = getDiskPreset(presetKey)
    setRequestsInput(preset.requests.join(', '))
    setInitialHead(preset.head)
    setDiskSize(preset.diskSize)
    setDirection(preset.direction)
    setAlgorithm(preset.algorithm)
    setSimulationResult(null)
  }

  const handleReset = () => {
    setSimulationResult(null)
  }

  const seekSequence = simulationResult?.seekSequence ?? []
  const steps = simulationResult?.steps ?? []
  const totalSeekCount = simulationResult?.totalSeekCount ?? 0
  const avgSeekCount = simulationResult?.avgSeekCount ?? '0.00'
  const maxCylinder = Math.max(1, (Number(diskSize) || 200) - 1)

  return (
    <div className="mx-auto max-w-[1480px] p-5 lg:p-8">
      {/* Top Header & Presets */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300/70">
            Storage Subsystem Simulator
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
            Disk Arm Scheduling Simulator
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Analyze seek paths, head turnaround, cylinder traverses, and seek efficiency across disk scheduling algorithms.
          </p>
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
            <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[#0f141d] p-1.5 shadow-2xl backdrop-blur-md">
              <button
                onClick={() => handleSelectPreset('textbook')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">Standard Textbook (Head: 53)</div>
                  <div className="text-[10px] text-slate-500">98, 183, 37, 122, 14, 124, 65, 67</div>
                </div>
              </button>
              <button
                onClick={() => handleSelectPreset('starvation')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">SSTF Starvation Risk</div>
                  <div className="text-[10px] text-slate-500">Cluster near 50 starving 190, 195</div>
                </div>
              </button>
              <button
                onClick={() => handleSelectPreset('boundary')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">Boundary Oscillations</div>
                  <div className="text-[10px] text-slate-500">Requests alternating near 10 and 180</div>
                </div>
              </button>
              <div className="my-1 border-t border-white/[0.06]" />
              <button
                onClick={() => handleSelectPreset('random')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">🎲 Random Workload</div>
                  <div className="text-[10px] text-slate-500">8 randomized cylinders (0–199)</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input Configuration Panel */}
      <div className="mb-6 rounded-xl border border-white/[0.08] bg-[#10151d] p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_130px_130px_160px_180px_auto] lg:items-end">
          {/* Track Requests Input */}
          <label className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Track Requests (comma or space separated)
            <input
              type="text"
              value={requestsInput}
              onChange={(e) => {
                setRequestsInput(e.target.value)
                setSimulationResult(null)
              }}
              placeholder="e.g. 98, 183, 37, 122, 14, 124, 65, 67"
              className="h-10 rounded-lg border border-white/10 bg-[#0b0f15] px-3 font-mono text-sm normal-case tracking-normal text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50"
            />
          </label>

          {/* Initial Head Position */}
          <label className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Initial Head
            <input
              type="number"
              min="0"
              max={maxCylinder}
              value={initialHead}
              onChange={(e) => {
                setInitialHead(Number(e.target.value) || 0)
                setSimulationResult(null)
              }}
              className="h-10 rounded-lg border border-white/10 bg-[#0b0f15] px-3 font-mono text-sm normal-case tracking-normal text-slate-200 outline-none focus:border-cyan-300/50"
            />
          </label>

          {/* Max Disk Size */}
          <label className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Disk Size (Cylinders)
            <input
              type="number"
              min="10"
              max="5000"
              value={diskSize}
              onChange={(e) => {
                setDiskSize(Number(e.target.value) || 200)
                setSimulationResult(null)
              }}
              className="h-10 rounded-lg border border-white/10 bg-[#0b0f15] px-3 font-mono text-sm normal-case tracking-normal text-slate-200 outline-none focus:border-cyan-300/50"
            />
          </label>

          {/* Direction Toggle */}
          <div className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Direction
            <div className="flex h-10 items-center rounded-lg border border-white/10 bg-[#0b0f15] p-1">
              <button
                type="button"
                onClick={() => {
                  setDirection('left')
                  setSimulationResult(null)
                }}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-xs font-semibold normal-case tracking-normal transition-colors ${
                  direction === 'left'
                    ? 'bg-cyan-300 text-[#071014] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Decreasing cylinders (toward 0)"
              >
                <ArrowLeft className="size-3" /> Left
              </button>
              <button
                type="button"
                onClick={() => {
                  setDirection('right')
                  setSimulationResult(null)
                }}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-xs font-semibold normal-case tracking-normal transition-colors ${
                  direction === 'right'
                    ? 'bg-cyan-300 text-[#071014] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Increasing cylinders (toward max)"
              >
                Right <ArrowRight className="size-3" />
              </button>
            </div>
          </div>

          {/* Algorithm Selection */}
          <label className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Algorithm
            <select
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value)
                setSimulationResult(null)
              }}
              className="h-10 rounded-lg border border-white/10 bg-[#0b0f15] px-3 text-sm normal-case tracking-normal text-slate-200 outline-none focus:border-cyan-300/50"
            >
              <option value="FCFS">FCFS (First-Come, First-Served)</option>
              <option value="SSTF">SSTF (Shortest Seek Time First)</option>
              <option value="SCAN">SCAN (Elevator)</option>
              <option value="C-SCAN">C-SCAN (Circular SCAN)</option>
              <option value="LOOK">LOOK</option>
              <option value="C-LOOK">C-LOOK (Circular LOOK)</option>
            </select>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={parsedRequests.length === 0}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-[#071014] shadow-[0_0_24px_rgba(103,232,249,0.15)] transition-all hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Play className="size-3.5 fill-current" />
              <span>Simulate</span>
            </button>
            {simulationResult && (
              <button
                onClick={handleReset}
                className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                title="Reset simulation"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Requests sequence info */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">I/O Queue:</span>
          {parsedRequests.map((r, idx) => (
            <span
              key={`req-chip-${r}-${idx}`}
              className="inline-flex items-center rounded border border-white/10 bg-[#0b0f15] px-2 py-0.5 font-mono text-[11px] text-slate-300"
            >
              {r}
            </span>
          ))}
          <span className="ml-auto font-mono text-[11px] text-cyan-300/70">
            Initial Head: <b className="text-cyan-200">{initialHead}</b> • Range: [0, {maxCylinder}]
          </span>
        </div>
      </div>

      {/* Results View Area */}
      {simulationResult !== null ? (
        <div className="space-y-6">
          {/* Seek Path Visualizer Chart */}
          <section className="rounded-xl border border-white/[0.08] bg-[#10151d] p-5 shadow-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
                  Visual Seek Trajectory
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-slate-100">
                  Head Movement Chart ({algorithm} • {direction.toUpperCase()})
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-cyan-400" /> Start: Track {initialHead}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-400" /> End: Track {seekSequence[seekSequence.length - 1]}
                </span>
              </div>
            </div>

            {/* SVG Trajectory Graph */}
            <div className="rounded-lg border border-white/[0.06] bg-[#0b0f15] p-4 overflow-x-auto">
              <div className="min-w-[720px]">
                {/* Cylinder Axis Marks */}
                <div className="mb-3 flex justify-between border-b border-white/10 pb-1 font-mono text-[11px] text-slate-500">
                  <span>Track 0</span>
                  <span>Track {Math.floor(maxCylinder * 0.25)}</span>
                  <span>Track {Math.floor(maxCylinder * 0.5)}</span>
                  <span>Track {Math.floor(maxCylinder * 0.75)}</span>
                  <span>Track {maxCylinder}</span>
                </div>

                {/* SVG Visualizer */}
                {(() => {
                  const svgWidth = 860
                  const rowHeight = 36
                  const paddingX = 40
                  const usableWidth = svgWidth - paddingX * 2
                  const svgHeight = Math.max(180, seekSequence.length * rowHeight + 30)

                  // Map track number (0 to maxCylinder) to X coordinate
                  const getX = (track) => {
                    const ratio = Math.max(0, Math.min(1, track / maxCylinder))
                    return paddingX + ratio * usableWidth
                  }

                  const points = seekSequence.map((track, idx) => ({
                    x: getX(track),
                    y: 25 + idx * rowHeight,
                    track,
                    step: idx,
                  }))

                  return (
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
                      <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>

                      {/* Vertical Grid Guidelines for Quartiles */}
                      {[0, 0.25, 0.5, 0.75, 1].map((q) => {
                        const x = paddingX + q * usableWidth
                        return (
                          <line
                            key={`grid-${q}`}
                            x1={x}
                            y1={10}
                            x2={x}
                            y2={svgHeight - 10}
                            stroke="rgba(255,255,255,0.04)"
                            strokeDasharray="4 4"
                          />
                        )
                      })}

                      {/* Step Lines */}
                      {points.slice(0, points.length - 1).map((pt, idx) => {
                        const nextPt = points[idx + 1]
                        return (
                          <g key={`line-${idx}`}>
                            <line
                              x1={pt.x}
                              y1={pt.y}
                              x2={nextPt.x}
                              y2={nextPt.y}
                              stroke="url(#pathGradient)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            {/* Direction Arrow marker along mid-point */}
                            <circle
                              cx={(pt.x + nextPt.x) / 2}
                              cy={(pt.y + nextPt.y) / 2}
                              r="3"
                              fill="#67e8f9"
                              opacity="0.6"
                            />
                          </g>
                        )
                      })}

                      {/* Trajectory Points & Badges */}
                      {points.map((pt, idx) => {
                        const isStart = idx === 0
                        const isEnd = idx === points.length - 1

                        return (
                          <g key={`pt-${idx}`}>
                            {/* Circle Node */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isStart || isEnd ? 6.5 : 4.5}
                              className={
                                isStart
                                  ? 'fill-cyan-400 stroke-white stroke-2'
                                  : isEnd
                                  ? 'fill-emerald-400 stroke-white stroke-2'
                                  : 'fill-[#0b0f15] stroke-cyan-300 stroke-2'
                              }
                            />
                            {/* Label */}
                            <text
                              x={pt.x}
                              y={pt.y - 10}
                              textAnchor="middle"
                              className="fill-slate-300 font-mono text-[10px] font-semibold select-none"
                            >
                              {pt.track}
                            </text>
                            {/* Step Index Badge on the left margin */}
                            <text
                              x={15}
                              y={pt.y + 4}
                              textAnchor="middle"
                              className="fill-slate-600 font-mono text-[9px] select-none"
                            >
                              #{idx}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  )
                })()}
              </div>
            </div>
          </section>

          {/* Metrics Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={Gauge}
              label="Total Head Movement"
              value={`${totalSeekCount} cylinders`}
              subtext="Cumulative track distance traversed by the disk arm"
              accent="cyan"
            />
            <MetricCard
              icon={Activity}
              label="Average Seek Length"
              value={`${avgSeekCount} cylinders`}
              subtext={`Across ${steps.length} total head movements`}
              accent="indigo"
            />
            <MetricCard
              icon={Layers}
              label="Total Requests Serviced"
              value={parsedRequests.length}
              subtext={`Initial head at cylinder ${initialHead}`}
              accent="emerald"
            />
          </div>

          {/* Detailed Step Table */}
          <section className="rounded-xl border border-white/[0.08] bg-[#10151d] p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
                  Execution Trace
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-slate-100">
                  Step-by-Step Movement Log
                </h3>
              </div>
              <span className="font-mono text-xs text-slate-400">
                {steps.length} movements
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600">
                    <th className="pb-3 font-medium">Step</th>
                    <th className="pb-3 font-medium">From Cylinder</th>
                    <th className="pb-3 font-medium">To Cylinder</th>
                    <th className="pb-3 font-medium">Direction</th>
                    <th className="pb-3 text-right font-medium">Distance Traversed</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((st) => {
                    const isRight = st.to >= st.from
                    return (
                      <tr key={`step-row-${st.step}`} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                        <td className="py-3 font-mono font-medium text-cyan-200">#{st.step}</td>
                        <td className="py-3 font-mono text-slate-300">{st.from}</td>
                        <td className="py-3 font-mono font-semibold text-slate-100">{st.to}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] ${
                              isRight
                                ? 'bg-cyan-400/10 text-cyan-300'
                                : 'bg-indigo-400/10 text-indigo-300'
                            }`}
                          >
                            {isRight ? <ArrowRight className="size-3" /> : <ArrowLeft className="size-3" />}
                            {isRight ? 'Increasing' : 'Decreasing'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold text-emerald-400">
                          +{st.distance}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-[#10151d]/60 p-16 text-center shadow-inner">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <HardDrive className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No Active Disk Simulation</h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Configure cylinder requests, initial head position, and select an algorithm, then click{' '}
            <span className="text-cyan-300 font-medium">'Simulate'</span> to chart head trajectories.
          </p>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5 text-[10px] uppercase tracking-[0.12em] text-slate-600">
        <span>KernelLab Disk Scheduling Module</span>
        <span>FCFS • SSTF • SCAN • C-SCAN • LOOK • C-LOOK</span>
      </footer>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, subtext, accent }) {
  const colorStyles = {
    indigo: {
      badge: 'text-indigo-300 bg-indigo-400/10',
      bar: 'bg-indigo-400',
    },
    emerald: {
      badge: 'text-emerald-300 bg-emerald-400/10',
      bar: 'bg-emerald-400',
    },
    cyan: {
      badge: 'text-cyan-300 bg-cyan-400/10',
      bar: 'bg-cyan-300',
    },
  }

  const currentTheme = colorStyles[accent] || colorStyles.cyan

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#10151d] p-5 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-slate-100">{value}</p>
          <p className="mt-1 text-[11px] text-slate-500">{subtext}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-lg ${currentTheme.badge}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full w-full rounded-full ${currentTheme.bar}`} />
      </div>
    </div>
  )
}
