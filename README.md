# KernelLab OS Simulator Suite

> An interactive web-based educational suite for visualizing operating system algorithms, resource management, and simulation workflows.

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Problem Statement & Overview

Understanding core Operating Systems concepts—such as process scheduling, memory virtualization, disk I/O optimization, and multi-resource deadlock avoidance—can be challenging when taught purely through static textbook diagrams. 

**KernelLab OS Simulator Suite** solves this by providing a hands-on, interactive visual laboratory. Learners, educators, and systems enthusiasts can input custom workloads, observe step-by-step state transitions, compare algorithmic trade-offs (e.g., turnaround time, seek distance, page fault rate), and test classical edge cases (such as Belady's Anomaly or deadlock states) in real time through an intuitive, modern dark-themed interface.

---

## 🚀 Key Features & Simulation Modules

### 🖥️ Module 1 — CPU Scheduling Simulator
Simulates and visualizes how an operating system schedules processes on the CPU.
- **Supported Algorithms:**
  - First-Come, First-Served (FCFS)
  - Shortest Job First (SJF — Non-preemptive)
  - Shortest Remaining Time First (SRTF — Preemptive)
  - Round Robin (RR — with configurable time quantum)
  - Priority Scheduling (Preemptive)
- **Interactive Capabilities:**
  - Live Gantt Chart that renders block-by-block as the simulation ticks forward.
  - Granular playback controls: Play, Pause, Step Forward, Step Backward, and Reset.
  - Process State Containers: Real-time tracking across Job Pool, Ready Queue, Running, and Terminated states.
  - Comprehensive metrics: Waiting Time, Turnaround Time, and Completion Time per process.
  - Curated Presets: *Priority Inversion*, *RR Quantum Sensitivity*, and *Context Switch Heavy*.

### 🗂️ Module 2 — Memory Page Replacement Visualizer
Simulates physical memory frame management and analyzes page fault dynamics.
- **Supported Algorithms:**
  - First-In, First-Out (FIFO)
  - Least Recently Used (LRU)
  - Optimal Page Replacement (OPT)
- **Interactive Capabilities:**
  - Dynamic Frame Matrix displaying the state of physical frames at each memory access.
  - Visual Hit / Fault indicators with color accents for quick recognition.
  - Performance Summary: Total References, Hits, Faults, and Hit Ratio percentage.
  - Classical Preset: One-click demonstration of **Belady's Anomaly** (where increasing frame count increases page faults under FIFO).

### 💾 Module 3 — Disk Scheduling Simulator
Visualizes magnetic disk head trajectories and measures seek latency across track requests.
- **Supported Algorithms:**
  - First-Come, First-Served (FCFS)
  - Shortest Seek Time First (SSTF)
  - SCAN (Elevator Algorithm)
  - C-SCAN (Circular SCAN)
  - LOOK
  - C-LOOK
- **Interactive Capabilities:**
  - Animated SVG track graph illustrating exact cylinder head traversal.
  - Step-by-step seek distance calculation and running total head movement.
  - Configurable disk boundaries, initial head position, and sweep direction (Inward / Outward).
  - Presets: *High Locality*, *Thrashing Simulation*, and *Sequential Access*.

### 🔒 Module 4 — Deadlock Avoidance (Banker's Algorithm)
Evaluates whether a multi-resource system allocation state is safe and evaluates dynamic resource requests.
- **Interactive Capabilities:**
  - **Safety State Verification:** Runs Dijkstra's Banker's Safety Algorithm to detect safe sequences ($<P_1, P_3, \dots>$) or alert on potential deadlock.
  - **Auto-Derived Need Matrix:** Computes $\text{Need} = \text{Max} - \text{Allocation}$ dynamically.
  - **Step-by-Step Execution Trace:** Displays running Work vectors and intermediate allocation steps.
  - **Resource Request Simulation:** Test immediate allocation requests from any process to determine if granting the request preserves system safety.

---

## 📸 Screenshots

<!-- Replace the placeholder below with actual application screenshots when deployed -->
| CPU Scheduling | Page Replacement |
|:---:|:---:|
| ![CPU Scheduler](public/favicon.svg) <br> *CPU Scheduling & Gantt Chart* | ![Page Replacement](public/favicon.svg) <br> *Memory Frame Allocation Matrix* |

| Disk Scheduling | Banker's Algorithm |
|:---:|:---:|
| ![Disk Scheduling](public/favicon.svg) <br> *Head Trajectory & Seek Distances* | ![Banker's Algorithm](public/favicon.svg) <br> *Deadlock Avoidance & Need Matrix* |

---

## 🛠️ Technology Stack

- **Frontend Library:** [React 19](https://react.dev/)
- **Build Tool & Dev Server:** [Vite 8](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Linter & Static Analysis:** [Oxlint](https://oxc.rs/)

---

## 📦 Prerequisites

Before running the project locally, ensure you have:
- **Node.js:** `v18.0.0` or higher (tested on Node `v22.x`)
- **Package Manager:** `npm` (`v9.x` or higher)

---

## 💻 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/jay05124/KernelLab-OS-Simulator-Suite.git
cd KernelLab-OS-Simulator-Suite
```

### 2. Install Dependencies
```bash
npm install
```
*(or `npm ci` for a clean install using the lockfile)*

### 3. Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🧪 Verification & Production Build

### Static Code Linting
Run Oxlint to check code quality:
```bash
npm run lint
```

### Production Build
Compile an optimized production bundle:
```bash
npm run build
```
The compiled static assets will be output to the `dist/` directory.

### Preview Production Build
Locally preview the built application:
```bash
npm run preview
```

---

## 📁 Project Directory Structure

```
KernelLab-OS-Simulator-Suite/
├── public/                       # Static public assets (icons, favicons)
│   ├── favicon.svg
│   └── icons.svg
├── src/                          # Application source code
│   ├── assets/                   # Brand graphics and images
│   ├── components/               # Core interactive simulator views
│   │   ├── CPUScheduler.jsx      # Module 1: CPU Scheduling interface
│   │   ├── PageReplacement.jsx   # Module 2: Memory Page Replacement interface
│   │   ├── DiskScheduling.jsx    # Module 3: Disk Scheduling interface
│   │   └── BankerAlgorithm.jsx   # Module 4: Deadlock Avoidance interface
│   ├── utils/                    # Pure algorithmic implementations
│   │   ├── cpuAlgorithms.js      # FCFS, SJF, SRTF, RR, Priority algorithms
│   │   ├── pageAlgorithms.js     # FIFO, LRU, Optimal algorithms
│   │   ├── diskAlgorithms.js     # FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK
│   │   └── bankerAlgorithms.js   # Safety check & resource request logic
│   ├── App.jsx                   # Main layout and sidebar navigation shell
│   ├── App.css                   # Component-level styling rules
│   ├── index.css                 # Global CSS and Tailwind CSS directives
│   └── main.jsx                  # React application entrypoint
├── .gitignore                    # Git file exclusions
├── .oxlintrc.json                # Oxlint configuration
├── index.html                    # HTML shell
├── LICENSE                       # MIT License
├── package.json                  # Dependencies and build scripts
├── package-lock.json             # Locked dependency tree
├── README.md                     # Project documentation
└── vite.config.js                # Vite build configuration
```

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

To report an issue or suggest a new simulation module, please use [GitHub Issues](https://github.com/jay05124/KernelLab-OS-Simulator-Suite/issues).

---

## 📜 License & Credits

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.

Built with dedication to open educational software for operating systems learners.
