'use client'

import { useState } from 'react'
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  HardDrive,
  Menu,
  ShieldCheck,
} from 'lucide-react'
import CPUScheduler from './components/CPUScheduler'
import PageReplacement from './components/PageReplacement'
import DiskScheduling from './components/DiskScheduling'
import BankerAlgorithm from './components/BankerAlgorithm'

const modules = [
  { id: 'cpu', label: 'CPU Scheduling', icon: Cpu, badge: 'v2.0' },
  { id: 'page', label: 'Page Replacement', icon: Database, badge: 'v1.0' },
  { id: 'disk', label: 'Disk Scheduling', icon: HardDrive, badge: 'v1.0' },
  { id: 'deadlock', label: 'Deadlock Avoidance', icon: ShieldCheck, badge: 'Soon' },
]

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeModule, setActiveModule] = useState('disk') // Can toggle between 'cpu', 'page', 'disk'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[#080b10] text-slate-100">
      <div className="flex min-h-screen">
        {/* Left Sidebar Navigation */}
        <aside
          className={`${
            collapsed ? 'w-[76px]' : 'w-[252px]'
          } hidden shrink-0 border-r border-white/[0.07] bg-[#0d1118] transition-[width] duration-200 lg:flex lg:flex-col`}
        >
          {/* Logo / Brand Header */}
          <div className="flex h-[72px] items-center border-b border-white/[0.07] px-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Activity className="size-5" />
            </div>
            {!collapsed && (
              <div className="ml-3">
                <p className="text-sm font-semibold tracking-tight">
                  Kernel<span className="text-cyan-300">Lab</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">OS Simulator Suite</p>
              </div>
            )}
          </div>

          {/* Module Nav Links */}
          <div className="flex-1 px-3 py-6">
            {!collapsed && (
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Core Modules
              </p>
            )}
            <nav className="flex flex-col gap-1" aria-label="OS Modules">
              {modules.map(({ id, label, icon: Icon, badge }) => {
                const isActive = activeModule === id
                const isEnabled = id === 'cpu' || id === 'page' || id === 'disk' || id === 'deadlock'

                return (
                  <button
                    key={id}
                    onClick={() => {
                      if (isEnabled) {
                        setActiveModule(id)
                      }
                    }}
                    disabled={!isEnabled}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] transition-colors ${
                      isActive
                        ? 'bg-cyan-400/10 text-cyan-200 font-medium'
                        : isEnabled
                        ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                        : 'text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    <Icon className="size-[17px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{label}</span>
                        {badge && (
                          <span
                            className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${
                              isActive
                                ? 'bg-cyan-400/20 text-cyan-300'
                                : 'bg-white/[0.05] text-slate-500'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                        {isActive && <span className="size-1.5 rounded-full bg-cyan-300 ml-1.5" />}
                      </>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Collapse Sidebar Toggle */}
          <div className="border-t border-white/[0.07] p-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <>
                  <ChevronLeft className="size-4" />
                  <span>Collapse sidebar</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <section className="min-w-0 flex-1 flex flex-col">
          {/* Top Header Bar */}
          <header className="flex h-[72px] items-center justify-between border-b border-white/[0.07] bg-[#0b0f15] px-5 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-md p-2 text-slate-400 hover:bg-white/[0.05] lg:hidden"
                aria-label="Toggle navigation"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <p className="text-xs text-slate-500">
                  Operating Systems /{' '}
                  <span className="text-slate-300">
                    {activeModule === 'cpu'
                      ? 'CPU Scheduling'
                      : activeModule === 'page'
                      ? 'Page Replacement'
                      : 'Disk Scheduling'}
                  </span>
                </p>
                <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-100">
                  {activeModule === 'cpu'
                    ? 'CPU Scheduling Engine'
                    : activeModule === 'page'
                    ? 'Page Replacement Visualizer'
                    : 'Disk Scheduling Simulator'}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-400" /> System Active
              <span className="ml-3 rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-slate-400">
                KernelLab Suite v2.0
              </span>
            </div>
          </header>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="border-b border-white/10 bg-[#0d1118] p-4 lg:hidden">
              <div className="flex flex-col gap-1">
                {modules.map(({ id, label, icon: Icon }) => {
                  const isEnabled = id === 'cpu' || id === 'page' || id === 'disk'
                  return (
                    <button
                      key={`mobile-${id}`}
                      onClick={() => {
                        if (isEnabled) {
                          setActiveModule(id)
                          setMobileMenuOpen(false)
                        }
                      }}
                      disabled={!isEnabled}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs ${
                        activeModule === id
                          ? 'bg-cyan-400/10 text-cyan-200 font-semibold'
                          : isEnabled
                          ? 'text-slate-400 hover:bg-white/5'
                          : 'text-slate-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dynamic Active Module View */}
          <div className="flex-1">
            {activeModule === 'cpu' && <CPUScheduler />}
            {activeModule === 'page' && <PageReplacement />}
            {activeModule === 'disk' && <DiskScheduling />}
          {activeModule === 'deadlock' && <BankerAlgorithm />}
          </div>
        </section>
      </div>
    </main>
  )
}
