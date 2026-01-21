# OS Algorithm Visualizer (Memory Management Suite)

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg)

A comprehensive, interactive web-based simulator for Operating System memory management concepts. This tool visualizes the complexities of memory allocation, paging logic, replacement algorithms, and contiguous allocation strategies in a modern, user-friendly interface.

---

## 🌟 Key Features

### 1. **Core Paging Simulator**
*   **Visual RAM Grid**: See exactly how logical memory pages map to physical frames in real-time.
*   **Dynamic Fragmentation**: Automatically calculates and highlights **Internal Fragmentation** (wasted space within pages).
*   **Page Fault Simulation**: Tracks and displays page faults when processes demand more memory than available frames.
*   **Visual Status**: Color-coded blocks distinguish between Free (Dark), Occupied (Green Glow), and victim pages.

### 2. **Interactive Control Panel**
Manage the system state dynamically without reloading:
*   **Deallocate**: Terminate processes to free up frames.
*   **Heap Growth**: Simulate dynamic memory requests (`malloc`) for running processes.
*   **Process Updates**: Modify memory requirements on the fly to observe system adaptation.
*   **Real-time Analytics**: Instant feedback on **RAM Utilization %**, **Free Space**, and **Total Internal Fragmentation**.

### 3. **Performance Matrix (Page Replacement)**
Run benchmark simulations to compare different replacement policies side-by-side:
*   **Algorithms**:
    *   **FIFO** (First-In, First-Out)
    *   **LRU** (Least Recently Used)
    *   **OPT** (Optimal - Lookahead)
*   **Deep Analysis**:
    *   **Step-by-Step Visualization**: A detailed execution log showing every memory state change.
    *   **Metrics**: Calculates **Hit Ratio**, **Throughput**, **Allocation Time**, and **Thrashing Rate**.
    *   **Custom Workloads**: Define your own Reference Strings (e.g., `1 2 3 4 1 2 5`) to test corner cases like **Belady's Anomaly**.

### 4. **Contiguous Allocation Visualizer** (New!)
A completely separate module to simulate how OS kernels manage free holes in physical memory.
*   **Algorithms Supported**:
    *   **First Fit (FF)**: Fastest allocation (first available hole).
    *   **Best Fit (BF)**: Minimizes internal waste (best fitting hole).
    *   **Worst Fit (WF)**: Leaves largest potential gaps (largest hole).
    *   **Next Fit (NF)**: Distributes allocations evenly (circular search).
*   **Visual Output**: Time-stepped table showing the state of memory blocks after each allocation attempt.

### 5. **Modern UI/UX**
*   **Glassmorphism**: Premium "Neon Dark" aesthetic with translucent panels and blur effects.
*   **GSAP Animations**: Fluid, high-performance transitions for a native app feel.
*   **Responsive**: Fully responsive layout that works on desktops and tablets.

---

## 🛠️ Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend Core** | **HTML5** & **CSS3** | Structure and "Glassmorphism" Design System |
| **Logic Engine** | **JavaScript (ES6+)** | Simulation algorithms (Paging, FF/BF/WF/NF, FIFO/LRU/OPT) |
| **Animations** | **GSAP (GreenSock)** | Timeline-based UI animations and state transitions |
| **Notifications** | **SweetAlert2** | Modal dialogs and toast notifications |
| **Typography** | **Google Fonts** | 'Outfit' (Interface) and 'JetBrains Mono' (Data/Code) |

---

## 📂 Project Structure

| File | Description |
| :--- | :--- |
| `index.html` | The main application entry point and DOM structure. |
| `script.js` | **The Brain**. Contains `initSystem()`, `allocateMemory()`, `runMatrixSimulation()`, and `runAllocationLogic()`. |
| `style.css` | 400+ lines of custom CSS variables, flex/grid layouts, and visual effects. |
| `GUIDE.md` | Detailed user guide and algorithm explanations. |
| `OS_Project_final-1.c` | Original C language implementation (used as the logic reference). |

---

## 🚀 How to Run

1.  **Clone or Download** this repository.
2.  Open the folder in your file explorer.
3.  Double-click `index.html`.
4.  **Done!** The application runs entirely in the browser. No Node.js, Python, or backend server is required.

---

## 📚 Algorithm Reference

### Paging vs. Contiguous
*   **Paging** (Main Dashboard): Splits memory into fixed-size chunks (Frames). Great for minimizing *External Fragmentation*.
*   **Contiguous Allocation** (Modal Tool): Assigns continuous blocks of memory. Susceptible to External Fragmentation but easier to implement for simple systems.

### Page Replacement Strategies
*   **FIFO**: Fastest to implement, but sets a low performance bar.
*   **LRU**: The industry standard approximation for "Optimal". Uses "past history to predict future".
*   **Optimal**: The theoretical ceiling. Impossible to implement perfectly in real-time as it requires future knowledge.

---

**Developed for OS Algorithm Visualization Project**
