# User Guide & Algorithm Explanation

This guide explains how to use the OS Algorithm Visualizer and details the underlying logic for memory management, paging, and replacement algorithms.

---

## 1. Getting Started: Paging Simulator

### Step 1: System Configuration
When you launch the application, you enter the **Setup Phase**. Here you define the physical constraints of your simulated computer:
*   **Total Frames (RAM)**: The number of physical blocks available in memory (e.g., 50).
*   **Page Size**: The size of a single block in KB (e.g., 4KB).
*   **Number of Processes**: How many programs you want to load initially.

### Step 2: Process Definition
After clicking Next, you will see input cards for each process.
*   **Memory Requirement**: Enter the total KB each process needs.
    *   *Example*: If Page Size is 4KB and Process 1 needs 10KB, the system will calculate it needs **3 Pages** (4KB + 4KB + 2KB, with 2KB waste/fragmentation).

### Step 3: The Dashboard
Once initialized, you enter the main visualization:
*   **RAM Allocation Map**: The grid of squares represents your memory.
    *   **Green/Glow Block**: Occupied frame. Shows Process ID (e.g., P1) and Page Number.
    *   **Dark Block**: Free/Empty frame.
*   **Stats Panel**: Displays real-time data:
    *   **Utilization**: Percentage of RAM currently used.
    *   **Int. Frag**: "Internal Fragmentation" - Memory wasted inside pages because processes didn't use the full 4KB block.
    *   **Page Faults**: Number of times the system had to go to the disk (simulated).

---

## 2. Interactive Controls

The Control Panel on the left allows you to modify the system state dynamically:

*   **Deallocate Memory**: Select a Process ID and click "Free". This removes all its pages from RAM, making those frames available for other processes.
*   **Request Additional Memory**: If a running process needs more heap memory, select its ID and add the amount (in KB). The system will try to find free frames for these new pages.
*   **Update Process Memory**: Completely resets a process's requirement. Useful for simulating a process restarting with different needs.

> **Note**: If you request more memory than available, the system simulates a "Swap Out" event (pages moving to disk), increasing the *Page Fault* counter.

---

## 3. Performance Matrix (FIFO vs LRU vs OPT)

Click the **"Run Performance Matrix"** button to start a comparative simulation. This runs a background benchmark to compare three Page Replacement Algorithms:

1.  **FIFO (First-In, First-Out)**:
    *   The oldest page loaded into memory is the first victim to be removed when space is needed.
    *   *Pros*: Simple, low overhead.
    *   *Cons*: Can suffer from "Belady's Anomaly".

2.  **LRU (Least Recently Used)**:
    *   The page that hasn't been used for the longest time is removed.
    *   *Pros*: Generally performs better; closer to optimal behavior.
    *   *Cons*: Higher overhead (needs to track timestamps/usage bits).

3.  **Optimal (OPT)**:
    *   Looks ahead into the future sequence of requests and evicts the page that will not be used for the longest time.
    *   *Pros*: Theoretically best performance (lowest page faults).
    *   *Cons*: Impossible to implement in real-time systems (requires future knowledge). Used here as a benchmark baseline.

### Understanding the Metrics:
*   **Hit Ratio**: `(Hits / Total Requests) * 100`. Higher is better.
*   **Hits**: Frequency a requested page was found in RAM.
*   **Page Faults (Misses)**: Frequency a requested page had to be fetched from disk.
*   **Throughput**: Pages handled per second.
*   **Thrashing Rate**: Indicates if the system is overwhelmed (spending too much time swapping).

---

## 4. Contiguous Allocation Visualizer

Accessible via the secondary button in the panel, this tool simulates **Contiguous Memory Allocation** (distinct from Paging). It demonstrates how an OS fills "holes" (free memory blocks) with processes.

### Supported Algorithms:
1.  **First Fit (FF)**:
    *   Allocates the *first* hole that is large enough.
    *   *Speed*: Fast.
2.  **Best Fit (BF)**:
    *   Allocates the *smallest* hole that is large enough.
    *   *Goal*: Minimize wasted space in the allocated block (creates tiny external fragments).
3.  **Worst Fit (WF)**:
    *   Allocates the *largest* available hole.
    *   *Goal*: Leave large enough remaining gaps for other processes.
4.  **Next Fit (NF)**:
    *   Similar to First Fit, but begins searching from where the last allocation ended.
    *   *Goal*: Distribute allocations evenly across memory.

### Usage:
*   **Input Blocks**: Space-separated list of available memory hole sizes (e.g., `100 500 200`).
*   **Input Processes**: Space-separated list of process requirements (e.g., `212 417 112`).
*   **Output**: A time-stepped table showing the state of memory blocks after each process attempts allocation.

---

## 5. Under the Hood (Logic)

The JavaScript logic mirrors standard Operating System C implementations:

*   **Paging Logic**: 
    *   `Required Pages = ceil(Memory Required / Page Size)`
    *   **Fragmentation**: `(Total Allocated Pages * Page Size) - Memory Required`
    *   **Allocation**: Uses a linear scan to find free frames in the `frames[]` array.

*   **Simulation vs Real-Time**:
    *   The **Interactive Dashboard** uses discrete events driven by user clicks.
    *   The **Performance Matrix** generates a randomized "Reference String" (sequence of page accesses) based on the current processes to mathematically simulate CPU workload.
