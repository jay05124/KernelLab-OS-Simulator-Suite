import { useState, useMemo } from 'react'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Database,
  Layers,
  Percent,
  Play,
  RotateCcw,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react'
import { executePageAlgorithm, getPagePreset } from '../utils/pageAlgorithms'

export default function PageReplacement() {
  const [refStringInput, setRefStringInput] = useState('7, 0, 1, 2, 0, 3, 0, 4, 2, 3')
  const [frameCount, setFrameCount] = useState(3)
  const [algorithm, setAlgorithm] = useState('FIFO')
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false)
  const [simulationResult, setSimulationResult] = useState(null)

  // Parse reference string into array of integers
  const parsedReferenceString = useMemo(() => {
    return refStringInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !isNaN(Number(s)))
      .map((s) => parseInt(s, 10))
  }, [refStringInput])

  const handleRun = () => {
    if (parsedReferenceString.length === 0) return
    const validFrames = Math.max(1, Math.min(7, Number(frameCount) || 3))
    const result = executePageAlgorithm(algorithm, parsedReferenceString, validFrames)
    setSimulationResult(result)
  }

  const handleSelectPreset = (presetKey) => {
    setPresetDropdownOpen(false)
    const preset = getPagePreset(presetKey)
    setRefStringInput(preset.referenceString.join(', '))
    setFrameCount(preset.frames)
    setAlgorithm(preset.algorithm)
    setSimulationResult(null)
  }

  const handleReset = () => {
    setSimulationResult(null)
  }

  const steps = simulationResult?.steps ?? []
  const summary = simulationResult?.summary ?? { totalFaults: 0, totalHits: 0, hitRatio: 0 }
  const validFramesCount = Math.max(1, Math.min(7, Number(frameCount) || 3))

  return (
    <div className="mx-auto max-w-[1480px] p-5 lg:p-8">
      {/* Top Header & Presets */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300/70">
            Memory Management Visualizer
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
            Page Replacement Simulator
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Analyze memory frames, page faults, hits, and cache behavior across FIFO, LRU, and Optimal.
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
            <span>Load Preset Benchmark</span>
            <ChevronDown className="size-3.5 text-slate-400" />
          </button>

          {presetDropdownOpen && (
            <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[#0f141d] p-1.5 shadow-2xl backdrop-blur-md">
              <button
                onClick={() => handleSelectPreset('belady')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">Belady's Anomaly (FIFO)</div>
                  <div className="text-[10px] text-slate-500">1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5</div>
                </div>
              </button>
              <button
                onClick={() => handleSelectPreset('lru_classic')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">Classic LRU Test</div>
                  <div className="text-[10px] text-slate-500">Standard textbook 20-page trace</div>
                </div>
              </button>
              <div className="my-1 border-t border-white/[0.06]" />
              <button
                onClick={() => handleSelectPreset('random')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
              >
                <div>
                  <div className="font-medium">🎲 Random String</div>
                  <div className="text-[10px] text-slate-500">15 randomized pages (0–9)</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input Configuration Panel */}
      <div className="mb-6 rounded-xl border border-white/[0.08] bg-[#10151d] p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_160px_220px_auto] lg:items-end">
          {/* Reference String Input */}
          <label className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Reference String (comma or space separated)
            <input
              type="text"
              value={refStringInput}
              onChange={(e) => {
                setRefStringInput(e.target.value)
                setSimulationResult(null)
              }}
              placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4, 2, 3"
              className="h-10 rounded-lg border border-white/10 bg-[#0b0f15] px-3 font-mono text-sm normal-case tracking-normal text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50"
            />
          </label>

          {/* Number of Frames */}
          <label className="flex flex-col gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Frames (1 – 7)
            <input
              type="number"
              min="1"
              max="7"
              value={frameCount}
              onChange={(e) => {
                const val = Math.max(1, Math.min(7, Number(e.target.value) || 1))
                setFrameCount(val)
                setSimulationResult(null)
              }}
              className="h-10 rounded-lg border border-white/10 bg-[#0b0f15] px-3 font-mono text-sm normal-case tracking-normal text-slate-200 outline-none focus:border-cyan-300/50"
            />
          </label>

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
              <option value="FIFO">FIFO (First-In-First-Out)</option>
              <option value="LRU">LRU (Least Recently Used)</option>
              <option value="Optimal">Optimal (OPT / Belady's Min)</option>
            </select>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={parsedReferenceString.length === 0}
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

        {/* Parsed stream preview bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Parsed Stream:</span>
          {parsedReferenceString.length === 0 ? (
            <span className="text-slate-600 italic">No valid pages entered</span>
          ) : (
            parsedReferenceString.map((p, idx) => (
              <span
                key={`stream-${p}-${idx}`}
                className="inline-flex size-6 items-center justify-center rounded border border-white/10 bg-[#0b0f15] font-mono text-[11px] text-slate-300"
              >
                {p}
              </span>
            ))
          )}
          <span className="ml-auto font-mono text-[11px] text-cyan-300/70">
            {parsedReferenceString.length} Total Requests
          </span>
        </div>
      </div>

      {/* Visualizer Grid Matrix */}
      {simulationResult !== null ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-white/[0.08] bg-[#10151d] p-5 shadow-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
                  Execution State Matrix
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-slate-100">
                  Step-by-Step Page Allocation ({algorithm} • {validFramesCount} Frames)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span>Page Hit</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="size-2 rounded-full bg-rose-400" />
                  <span>Page Fault</span>
                </div>
              </div>
            </div>

            {/* Matrix Table with Horizontal Scroll */}
            <div className="overflow-x-auto pb-4">
              <div className="inline-flex flex-col gap-2 min-w-full">
                {/* Reference String Row (Incoming Request) */}
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-28 shrink-0 items-center justify-end pr-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Page Ref
                  </div>
                  <div className="flex items-center gap-2">
                    {steps.map((step, idx) => (
                      <div
                        key={`ref-header-${idx}`}
                        className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all ${
                          step.isFault
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        }`}
                      >
                        {step.page}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="my-1 border-t border-white/[0.06]" />

                {/* Physical Memory Frames Rows */}
                {Array.from({ length: validFramesCount }).map((_, frameIdx) => (
                  <div key={`frame-row-${frameIdx}`} className="flex items-center gap-2">
                    <div className="flex h-12 w-28 shrink-0 items-center justify-end pr-3 font-mono text-[11px] text-slate-400">
                      Frame {frameIdx}
                    </div>
                    <div className="flex items-center gap-2">
                      {steps.map((step, stepIdx) => {
                        const pageInSlot = step.frames[frameIdx]
                        const isAllocated = pageInSlot !== null
                        const isCurrentPage = pageInSlot === step.page

                        return (
                          <div
                            key={`frame-slot-${frameIdx}-${stepIdx}`}
                            className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all ${
                              step.isFault
                                ? isCurrentPage
                                  ? 'border-rose-400/60 bg-rose-400/20 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                                  : 'border-rose-500/15 bg-[#0b0f15] text-slate-300'
                                : isCurrentPage
                                ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                                : 'border-emerald-500/15 bg-[#0b0f15] text-slate-300'
                            }`}
                          >
                            {isAllocated ? (
                              <span>{pageInSlot}</span>
                            ) : (
                              <span className="text-[10px] text-slate-600">-</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="my-1 border-t border-white/[0.06]" />

                {/* Outcome Status Row (Hit / Fault Indicator) */}
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-28 shrink-0 items-center justify-end pr-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Status
                  </div>
                  <div className="flex items-center gap-2">
                    {steps.map((step, idx) => (
                      <div
                        key={`status-${idx}`}
                        className={`flex h-8 w-12 shrink-0 items-center justify-center rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                          step.isFault
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-emerald-500/10 text-emerald-300'
                        }`}
                        title={step.isFault ? `Fault #${step.faultCount}` : `Hit #${step.hitCount}`}
                      >
                        {step.isFault ? 'FAULT' : 'HIT'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Metrics Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={XCircle}
              label="Total Page Faults"
              value={summary.totalFaults}
              subtext={`${summary.totalFaults} memory evictions / load misses`}
              accent="rose"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Total Page Hits"
              value={summary.totalHits}
              subtext={`${summary.totalHits} immediate memory references`}
              accent="emerald"
            />
            <MetricCard
              icon={Percent}
              label="Hit Ratio (%)"
              value={`${summary.hitRatio}%`}
              subtext={`Efficiency across ${parsedReferenceString.length} total page accesses`}
              accent="cyan"
            />
          </div>
        </div>
      ) : (
        <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-[#10151d]/60 p-16 text-center shadow-inner">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Database className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No Active Page Simulation</h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Configure reference string, frame count, or choose a benchmark preset above, then click{' '}
            <span className="text-cyan-300 font-medium">'Simulate'</span> to visualize memory replacement step-by-step.
          </p>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5 text-[10px] uppercase tracking-[0.12em] text-slate-600">
        <span>KernelLab Memory Page Replacement Module</span>
        <span>FIFO • LRU • OPTIMAL</span>
      </footer>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, subtext, accent }) {
  const colorStyles = {
    rose: {
      badge: 'text-rose-400 bg-rose-500/10',
      bar: 'bg-rose-400',
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
