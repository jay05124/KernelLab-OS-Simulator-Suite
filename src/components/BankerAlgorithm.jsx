// Banker's Algorithm Visualizer Component
// Author: Antigravity
// Description: UI for deadlock avoidance using Banker's algorithm.

'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Play,
  ArrowRight,
  Activity,
  Database,
  Cpu,
} from 'lucide-react';
import {
  calculateNeed,
  checkSafety,
  evaluateRequest,
  getBankerPreset,
} from '../utils/bankerAlgorithms';

export default function BankerAlgorithm() {
  // UI State
  const [preset, setPreset] = useState('safe');
  const [allocation, setAllocation] = useState([]);
  const [max, setMax] = useState([]);
  const [available, setAvailable] = useState([]);
  const [need, setNeed] = useState([]);
  const [safetyResult, setSafetyResult] = useState(null);
  const [requestProcess, setRequestProcess] = useState('0');
  const [requestVector, setRequestVector] = useState([]);
  const [requestResult, setRequestResult] = useState(null);

  // Load preset data
  useEffect(() => {
    const { allocation, max, available } = getBankerPreset(preset);
    setAllocation(allocation);
    setMax(max);
    setAvailable(available);
    setRequestVector(new Array(available.length).fill(0));
  }, [preset]);

  // Compute Need and safety whenever data changes
  useEffect(() => {
    if (allocation.length && max.length && available.length) {
      const needMatrix = calculateNeed(allocation, max);
      setNeed(needMatrix);
      const safety = checkSafety(allocation, max, available);
      setSafetyResult(safety);
    }
  }, [allocation, max, available]);

  // Helper to render matrix as table
  const renderMatrix = (matrix, title) => (
    <div className="rounded-xl border border-white/[0.08] bg-[#10151d] p-4 mb-4">
      <p className="mb-2 font-medium text-cyan-300">{title}</p>
      <table className="w-full text-xs table-auto">
        <thead>
          <tr className="text-slate-600">
            <th className="pb-2"></th>
            {matrix[0]?.map((_, i) => (
              <th key={i} className="pb-2">R{i}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i} className="border-b border-white/[0.07] text-slate-400">
              <td className="pr-2 font-mono text-slate-300">P{i}</td>
              {row.map((val, j) => (
                <td key={j} className="text-center">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Handle request vector input changes
  const handleRequestChange = (idx, value) => {
    const newVec = [...requestVector];
    newVec[idx] = Number(value) || 0;
    setRequestVector(newVec);
  };

  const testRequest = () => {
    const procIdx = Number(requestProcess);
    const result = evaluateRequest(allocation, max, available, procIdx, requestVector);
    setRequestResult(result);
  };

  return (
    <div className="mx-auto max-w-[1480px] p-5 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-100">Deadlock Avoidance – Banker's Algorithm</h2>
        <p className="text-sm text-slate-400">Visualize resource allocation, safety checks and request evaluation.</p>
      </div>

      {/* Preset Selector */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-slate-300">Preset:</label>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="rounded bg-[#0b0f15] border border-white/10 px-3 py-2 text-slate-200"
        >
          <option value="safe">Textbook Safe</option>
          <option value="unsafe">Unsafe State</option>
          <option value="random">Random Preset</option>
        </select>
      </div>

      {/* Matrices */}
      {allocation.length && renderMatrix(allocation, 'Allocation Matrix')}
      {max.length && renderMatrix(max, 'Maximum Demand Matrix')}
      {available.length && (
        <div className="rounded-xl border border-white/[0.08] bg-[#10151d] p-4 mb-4">
          <p className="mb-2 font-medium text-cyan-300">Available Vector</p>
          <div className="flex gap-4">
            {available.map((val, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-slate-500">R{i}</span>
                <span className="font-mono text-slate-200">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {need.length && renderMatrix(need, 'Need Matrix')}

      {/* Safety Status Banner */}
      {safetyResult && (
        <div className={`mb-4 rounded p-4 flex items-center gap-3 ${safetyResult.isSafe ? 'bg-emerald-600/30 text-emerald-200' : 'bg-rose-600/30 text-rose-200'}`}>
          {safetyResult.isSafe ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          <span className="font-medium">
            {safetyResult.isSafe ? 'SYSTEM IS IN A SAFE STATE' : 'UNSAFE STATE – DEADLOCK RISK'}
          </span>
          {safetyResult.isSafe && (
            <span className="ml-3 text-sm">Safe Sequence: {safetyResult.safeSequence.join(' ➔ ')}</span>
          )}
        </div>
      )}

      {/* Step‑by‑step Trace */}
      {safetyResult && safetyResult.steps && safetyResult.steps.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-full text-xs table-auto">
            <thead className="bg-[#0b0f15] text-slate-400">
              <tr>
                <th className="px-2 py-1">Step</th>
                <th className="px-2 py-1">Process</th>
                <th className="px-2 py-1">Work Before</th>
                <th className="px-2 py-1">Need</th>
                <th className="px-2 py-1">Can Execute?</th>
                <th className="px-2 py-1">Work After</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {safetyResult.steps.map((s) => (
                <tr key={s.step} className="border-b border-white/[0.05]">
                  <td className="px-2 py-1 text-center">{s.step}</td>
                  <td className="px-2 py-1 text-center font-mono">{s.process}</td>
                  <td className="px-2 py-1 text-center">[{s.workBefore.join(', ')}]</td>
                  <td className="px-2 py-1 text-center">[{s.need.join(', ')}]</td>
                  <td className="px-2 py-1 text-center">
                    {s.canExecute ? <CheckCircle2 size={16} className="inline text-emerald-400" /> : <AlertTriangle size={16} className="inline text-rose-400" />}
                  </td>
                  <td className="px-2 py-1 text-center">
                    {s.workAfter ? `[${s.workAfter.join(', ')}]` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resource Request Simulator */}
      <div className="rounded-xl border border-white/[0.08] bg-[#10151d] p-5">
        <h3 className="mb-3 text-sm font-medium text-cyan-300">Test Resource Request</h3>
        <div className="flex items-center gap-4 mb-3">
          <label className="text-slate-300">Process:</label>
          <select
            value={requestProcess}
            onChange={(e) => {
              setRequestProcess(e.target.value);
              setRequestVector(new Array(available.length).fill(0));
            }}
            className="rounded bg-[#0b0f15] border border-white/10 px-3 py-2 text-slate-200"
          >
            {allocation.map((_, idx) => (
              <option key={idx} value={idx}>P{idx}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {available.map((_, rIdx) => (
            <div key={rIdx} className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">R{rIdx}</label>
              <input
                type="number"
                min="0"
                value={requestVector[rIdx] || ''}
                onChange={(e) => handleRequestChange(rIdx, e.target.value)}
                className="rounded bg-[#0b0f15] border border-white/10 px-2 py-1 text-slate-200"
              />
            </div>
          ))}
        </div>
        <button
          onClick={testRequest}
          className="flex items-center gap-2 rounded bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#071014] hover:bg-cyan-200"
        >
          <Play size={16} /> Test Request
        </button>
        {requestResult && (
          <div className={`mt-4 rounded p-3 text-sm ${requestResult.canBeGranted ? 'bg-emerald-600/20 text-emerald-200' : 'bg-rose-600/20 text-rose-200'}`}>
            {requestResult.canBeGranted ? <CheckCircle2 size={14} className="inline mr-1" /> : <AlertTriangle size={14} className="inline mr-1" />}
            {requestResult.reason}
          </div>
        )}
      </div>
    </div>
  );
}
