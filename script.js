/* =========================================
   OS MEMORY ALGORITHM CORE
   ========================================= */

/* Constants mirroring C - Global State */
const MAX_FRAMES = 100;
const MAX_PROCESSES = 100;
const MAX_DISK_PAGES = 200;

/* System State */
const SYS = {
    totalFrames: 0,
    pageSize: 0,
    processCount: 0,
    frames: [],     
    disk: [],       
    diskPageCount: 0,
    processes: [],  
    stats: {
        pageFaults: 0,
        swapTime: 0
    },
    lastRefString: [] 
};

const State = {
    WAITING: 'WAITING',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED'
};

/* ---------------------------------------------------------
   ANIMATIONS (GSAP)
--------------------------------------------------------- */
function ANIM_Init() {
    gsap.from("h1", { duration: 1.2, y: -50, opacity: 0, ease: "power3.out" });
    gsap.from(".section.active-section", { duration: 0.8, y: 30, opacity: 0, delay: 0.3 });
}

function ANIM_SwitchSection(fromId, toId) {
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);

    // Fade out current
    gsap.to(fromEl, {
        duration: 0.3, 
        opacity: 0, 
        y: -20, 
        onComplete: () => {
            fromEl.classList.remove('active-section');
            toEl.classList.add('active-section');
            
            // Fade in new
            gsap.fromTo(toEl, 
                { opacity: 0, y: 30 }, 
                { duration: 0.5, opacity: 1, y: 0, ease: "power2.out" }
            );
        }
    });

    if(toId === 'step-process') {
        // Animate input cards stagger
        setTimeout(() => {
            gsap.from(".process-card-input", {
                duration: 0.5, y: 20, opacity: 0, stagger: 0.1, ease: "back.out(1.7)"
            });
        }, 350);
    }
}

function ANIM_UpdateDashboard(newFrames, oldFrames) {
    gsap.from(".ram-block.active", {
        duration: 0.4, 
        scale: 0.5, 
        opacity: 0, 
        stagger: { amount: 0.5, from: "random" }, 
        ease: "back.out(1.2)"
    });
    
    document.querySelectorAll(".stat-box .val").forEach(el => {
        let endVal = parseInt(el.innerText);
        if(!isNaN(endVal)) {
            gsap.from(el, { innerText: 0, duration: 1, snap: { innerText: 1 }, ease: "power1.inOut" });
        }
    });
}

// Initial Call
window.addEventListener('DOMContentLoaded', ANIM_Init);


/* ---------------------------------------------------------
   CORE LOGIC FUNCTIONS
--------------------------------------------------------- */

function initSystem(totalFrames, pageSize, procCount) {
    SYS.totalFrames = parseInt(totalFrames);
    SYS.pageSize = parseInt(pageSize);
    SYS.processCount = parseInt(procCount);
    
    SYS.frames = Array.from({ length: SYS.totalFrames }, () => ({
        assigned: 0, processId: -1, pageNumber: -1
    }));

    SYS.disk = Array.from({ length: MAX_DISK_PAGES }, () => ({
        processId: -1, pageNumber: -1, inMemory: 0
    }));

    SYS.diskPageCount = 0;
    SYS.processes = [];
    SYS.stats = { pageFaults: 0, swapTime: 0 };
    SYS.lastRefString = [];
}

function requiredPages(memReq, pgSize) {
    return Math.ceil(memReq / pgSize);
}

function allocateMemory() {
    let changed = false;
    SYS.processes.forEach(proc => {
        const pagesNeeded = requiredPages(proc.memoryRequirement, SYS.pageSize);
        let allocatedPages = 0;

        for (let j = 0; j < SYS.totalFrames && allocatedPages < pagesNeeded; j++) {
            if (SYS.frames[j].assigned === 0) {
                SYS.frames[j].assigned = 1;
                SYS.frames[j].processId = proc.processId;
                SYS.frames[j].pageNumber = allocatedPages + 1;
                allocatedPages++;
                changed = true;
            } else if (SYS.frames[j].processId === proc.processId) {
                SYS.frames[j].pageNumber = allocatedPages + 1;
                allocatedPages++;
            }
        }

        if (allocatedPages === pagesNeeded) {
            for (let j = 0; j < SYS.totalFrames; j++) {
                if (SYS.frames[j].assigned === 1 && 
                    SYS.frames[j].processId === proc.processId) {
                    if (SYS.frames[j].pageNumber > allocatedPages) {
                        SYS.frames[j].assigned = 0;
                        SYS.frames[j].processId = -1;
                        SYS.frames[j].pageNumber = -1;
                        changed = true;
                    }
                }
            }
        }

        if (allocatedPages < pagesNeeded) {
            for (let j = 0; j < SYS.totalFrames; j++) {
                if (SYS.frames[j].assigned === 1 && SYS.frames[j].processId === proc.processId) {
                    swapOutPage(proc.processId, SYS.frames[j].pageNumber);
                    SYS.frames[j].assigned = 0;
                    SYS.frames[j].processId = -1;
                    SYS.frames[j].pageNumber = -1;
                    changed = true;
                }
            }
        }

        if (allocatedPages === pagesNeeded) {
            proc.allocated = 1;
            proc.state = State.RUNNING;
        } else {
             if(proc.allocated) changed = true; 
             proc.allocated = 0;
             proc.state = State.WAITING;
        }
    });

    updateDashboard(changed);
}

function swapOutPage(pid, pageNum) {
    if (SYS.diskPageCount < MAX_DISK_PAGES) {
        let idx = SYS.diskPageCount;
        SYS.disk[idx].processId = pid;
        SYS.disk[idx].pageNumber = pageNum;
        SYS.disk[idx].inMemory = 0;
        SYS.diskPageCount++;
        SYS.stats.pageFaults++;
    }
}

function deallocateProcess(pid) {
    let changed = false;
    for (let i = 0; i < SYS.totalFrames; i++) {
        if (SYS.frames[i].processId === pid) {
            SYS.frames[i].assigned = 0;
            SYS.frames[i].processId = -1;
            SYS.frames[i].pageNumber = -1;
            changed = true;
        }
    }
    const p = SYS.processes.find(x => x.processId === pid);
    if (p) {
        p.allocated = 0;
        p.state = State.COMPLETED;
        p.memoryRequirement = 0;
    }
    updateDashboard(changed);
    
    Swal.fire({
        icon: 'success',
        title: 'Memory Freed',
        text: `Process ${pid} has been deallocated.`,
        timer: 1500,
        showConfirmButton: false,
        background: '#1f2937',
        color: '#f3f4f6'
    });
}
/* ---------------------------------------------------------
   PERFORMANCE MATRIX SIMULATION
--------------------------------------------------------- */
function runMatrixSimulation(inputPages, frameCount = SYS.totalFrames) {
    // Force specific pages
    const pages = inputPages;
    const heavyLoad = () => { let x = 0; for(let z=0; z<100; z++) x += Math.sqrt(z); return x; };

    const fifo = runFIFO(pages, frameCount);
    const lru = runLRU(pages, frameCount);
    const opt = runOPT(pages, frameCount); 

    return { fifo, lru, opt, refString: pages, frameCount };
}

function padFrames(frames, limit) {
    const padded = [...frames];
    while(padded.length < limit) padded.push(-1);
    return padded;
}

function runFIFO(ref, framesCount) {
    let frames = [];
    let queue = [];
    let faults = 0;
    let hits = 0;
    let steps = [];
    let start = performance.now();

    for (let page of ref) {
        let status = "Miss";
        if (frames.includes(page)) {
            hits++;
            status = "Hit";
        } else {
            faults++;
            if (frames.length < framesCount) {
                frames.push(page);
                queue.push(page);
            } else {
                const removed = queue.shift();
                frames[frames.indexOf(removed)] = page;
                queue.push(page);
            }
        }
        steps.push({ p: page, frames: padFrames(frames, framesCount), status: status });
    }
    
    let duration = performance.now() - start;
    if(duration < 0.1) duration = 0.5;

    return {
        misses: faults,
        hits: hits,
        hitRatio: (hits / ref.length) * 100,
        throughput: (ref.length / (duration / 1000)),
        steps: steps
    };
}

function runLRU(ref, framesCount) {
    let frames = [];
    let recent = [];
    let faults = 0;
    let hits = 0;
    let steps = [];
    let start = performance.now();

    for (let page of ref) {
        let status = "Miss";
        if (frames.includes(page)) {
            hits++;
            status = "Hit";
            recent.splice(recent.indexOf(page), 1);
            recent.push(page);
        } else {
            faults++;
            if (frames.length < framesCount) {
                frames.push(page);
                recent.push(page);
            } else {
                const lruPage = recent.shift();
                frames[frames.indexOf(lruPage)] = page;
                recent.push(page);
            }
        }
        steps.push({ p: page, frames: padFrames(frames, framesCount), status: status });
    }

    let duration = performance.now() - start;
    if(duration < 0.1) duration = 0.5;

    return {
        misses: faults,
        hits: hits,
        hitRatio: (hits / ref.length) * 100,
        throughput: (ref.length / (duration / 1000)),
        steps: steps
    };
}

function runOPT(ref, framesCount) {
    let frames = [];
    let faults = 0;
    let hits = 0;
    let steps = [];
    let start = performance.now();

    for (let i = 0; i < ref.length; i++) {
        const page = ref[i];
        let status = "Miss";

        if (frames.includes(page)) {
            hits++;
            status = "Hit";
        } else {
            faults++;
            if (frames.length < framesCount) {
                frames.push(page);
            } else {
                const futureUse = frames.map(p => {
                    const index = ref.slice(i + 1).indexOf(p);
                    return index === -1 ? Infinity : index;
                });

                const replaceIndex = futureUse.indexOf(Math.max(...futureUse));
                frames[replaceIndex] = page;
            }
        }
        steps.push({ p: page, frames: padFrames(frames, framesCount), status: status });
    }

    let duration = performance.now() - start;
    if(duration < 0.1) duration = 0.5;

    return {
        misses: faults,
        hits: hits,
        hitRatio: (hits / ref.length) * 100,
        throughput: (ref.length / (duration / 1000)),
        steps: steps
    };
}


/* ---------------------------------------------------------
   UI BINDINGS
--------------------------------------------------------- */
function UI_goToProcessInput() {
    const f = document.querySelector('#sys-frames').value;
    const p = document.querySelector('#sys-page-size').value;
    const c = document.querySelector('#sys-proc-count').value;
    
    if (f <= 0 || p <= 0 || c <= 0) {
        Swal.fire({ icon: 'error', title: 'Invalid Input', text: 'Enter positive values.'});
        return;
    }
    
    initSystem(f, p, c);
    
    const grid = document.getElementById('process-inputs-grid');
    grid.innerHTML = '';
    
    for(let i=1; i<=SYS.processCount; i++) {
        let div = document.createElement('div');
        div.className = 'process-card-input glass-panel';
        div.innerHTML = `
            <label>Process ${i} Memory (KB)</label>
            <input type="number" id="inp-proc-${i}" placeholder="KB" min="1" oninput="validity.valid||(value='');">
        `;
        grid.appendChild(div);
    }
    
    ANIM_SwitchSection('step-setup', 'step-process');
}

function UI_initSimulation() {
    for(let i=1; i<=SYS.processCount; i++) {
        let val = document.getElementById(`inp-proc-${i}`).value;
        if(!val || val <= 0) { Swal.fire({ icon: 'warning', title: 'Missing Data' }); return; }
        
        SYS.processes.push({
            processId: i,
            memoryRequirement: parseInt(val),
            allocated: 0,
            state: State.WAITING
        });
    }
    
    allocateMemory();
    UI_initDashboardControls();
    ANIM_SwitchSection('step-process', 'step-dashboard');
    
    Swal.fire({ icon: 'success', title: 'System Initialized', timer: 1500, showConfirmButton: false, background: '#1f2937', color: '#f3f4f6' });
}

function UI_initDashboardControls() {
    UI_populateSelects();
    document.getElementById('disp-total-frames').innerText = SYS.totalFrames;
}

function UI_populateSelects() {
    const ids = ['ctrl-dealloc-pid', 'ctrl-req-pid', 'ctrl-upd-pid'];
    ids.forEach(id => {
        let el = document.getElementById(id);
        let currentVal = el.value; 
        el.innerHTML = '';
        SYS.processes.forEach(p => {
            let opt = document.createElement('option');
            opt.value = p.processId;
            opt.innerText = `P${p.processId} (${p.state === 'RUNNING' ? 'Run' : 'Wait'})`;
            el.appendChild(opt);
        });
        if(currentVal && Array.from(el.options).some(o => o.value == currentVal)) {
            el.value = currentVal;
        }
    });
}

function ACTION_deallocate() {
    let pid = parseInt(document.getElementById('ctrl-dealloc-pid').value);
    if(isNaN(pid)) { Swal.fire({ icon: 'warning', title: 'Error' }); return; }
    deallocateProcess(pid);
}

function ACTION_requestMore() {
    let pid = parseInt(document.getElementById('ctrl-req-pid').value);
    let amt = parseInt(document.getElementById('ctrl-req-amt').value);
    if(!amt || amt <= 0) return;
    
    let p = SYS.processes.find(x => x.processId === pid);
    if(p) { p.memoryRequirement += amt; allocateMemory(); }
}

function ACTION_updateProcess() {
    let pid = parseInt(document.getElementById('ctrl-upd-pid').value);
    let val = parseInt(document.getElementById('ctrl-upd-amt').value);
    if(!val || val <= 0) return;
    
    let p = SYS.processes.find(x => x.processId === pid);
    if(p) { p.memoryRequirement = val; allocateMemory(); }
}

function updateDashboard(animate = true) {
    const grid = document.getElementById('viz-ram-grid');
    grid.innerHTML = '';
    SYS.frames.forEach((f, idx) => {
        let div = document.createElement('div');
        div.className = `ram-block ${f.assigned ? 'active' : ''}`;
        div.innerHTML = `<span class="block-idx">${idx+1}</span><div class="pid">${f.assigned ? 'P'+f.processId : ''}</div><div class="page">${f.assigned ? 'P'+f.pageNumber : ''}</div>`;
        grid.appendChild(div);
    });
    
    const list = document.getElementById('viz-proc-list');
    list.innerHTML = '';
    SYS.processes.forEach(p => {
        let row = document.createElement('div');
        row.className = 'proc-row';
        row.innerHTML = `<div><strong>P${p.processId}</strong> <span style="color:var(--text-muted)">(${p.memoryRequirement} KB)</span></div><span class="status-badge ${p.state === 'RUNNING' ? 'status-running' : 'status-waiting'}">${p.state}</span>`;
        list.appendChild(row);
    });
    
    calculateAndRenderStats();
    UI_populateSelects();

    if(animate) ANIM_UpdateDashboard();
    
    // Auto-refresh Matrix if visible and we have data
    const matrixEl = document.getElementById('matrix-modal');
    if (matrixEl.style.display !== 'none' && SYS.lastRefString.length > 0) {
        ACTION_showMatrix(true); 
    }
}

function calculateAndRenderStats() {
    const used = SYS.frames.filter(f => f.assigned).length;
    const totalMem = SYS.totalFrames * SYS.pageSize;
    const usedMem = used * SYS.pageSize;
    const freeMem = totalMem - usedMem;
    const util = ((usedMem/totalMem)*100).toFixed(0);
    
    let intFragTotal = 0;
    SYS.processes.filter(p => p.allocated).forEach(p => {
        let pages = requiredPages(p.memoryRequirement, SYS.pageSize);
        intFragTotal += (pages * SYS.pageSize) - p.memoryRequirement; 
    });
    
    const statsHTML = `
        <div class="stat-box"><h4>Total Memory (KB)</h4><div class="val">${totalMem}</div></div>
        <div class="stat-box"><h4>Utilization (%)</h4><div class="val">${util}</div></div>
        <div class="stat-box"><h4>Free (KB)</h4><div class="val">${freeMem}</div></div>
        <div class="stat-box"><h4>Int. Frag (KB)</h4><div class="val">${intFragTotal}</div></div>
        <div class="stat-box"><h4>Page Faults</h4><div class="val">${SYS.stats.pageFaults}</div></div>
    `;
    document.getElementById('viz-stats').innerHTML = statsHTML;
}

async function ACTION_showMatrix(silent = false) {
    let pages = [];
    let frameCount = SYS.totalFrames;

    if (!silent) {
        // Prompt User
        const { value: formValues } = await Swal.fire({
            title: 'Performance Matrix',
            html:
                '<div style="text-align:left; margin-bottom:5px;"><label>Reference String</label></div>' +
                '<input id="sw-ref" class="swal2-input" value="7 0 1 2 0 3 0 4 2 3 0 3" style="margin: 0 0 15px 0;">' +
                '<div style="text-align:left; margin-bottom:5px;"><label>Comparison Frames</label></div>' +
                '<input id="sw-frames" type="number" class="swal2-input" value="3" min="1" style="margin: 0;">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Run Analysis',
            confirmButtonColor: '#4ade80',
            cancelButtonColor: '#ef4444',
            background: '#1f2937', color: '#f3f4f6',
            preConfirm: () => {
                return [
                    document.getElementById('sw-ref').value,
                    document.getElementById('sw-frames').value
                ]
            }
        });

        if (formValues) {
             pages = formValues[0].trim().split(/\s+/).map(Number);
             frameCount = parseInt(formValues[1]);
             if(!frameCount || frameCount < 1) frameCount = 3;

             SYS.lastRefString = pages;
             SYS.lastRefFrames = frameCount;
        } else {
            return; // Cancelled
        }
    } else {
        // Silent refresh
        if (SYS.lastRefString && SYS.lastRefString.length > 0) {
            pages = SYS.lastRefString;
            if(SYS.lastRefFrames) frameCount = SYS.lastRefFrames;
        } else {
            return; 
        }
    }

    const res = runMatrixSimulation(pages, frameCount);
    
    // Existing Summary Table
    let html = `
    <h3>Algorithms Comparison Summary <span style="font-size:0.6em; color:var(--text-muted)">(Frames: ${res.frameCount})</span></h3>
    <table class="styled-table">
        <thead>
            <tr><th>Metric</th><th>FIFO</th><th>LRU</th><th>Optimal (OPT)</th></tr>
        </thead>
        <tbody>
        <tr><td>Hit Ratio (%)</td><td class="code-font">${res.fifo.hitRatio.toFixed(1)}%</td><td class="code-font">${res.lru.hitRatio.toFixed(1)}%</td><td class="code-font" style="color:var(--primary)">${res.opt.hitRatio.toFixed(1)}%</td></tr>
        <tr><td>Page Faults</td><td class="code-font">${res.fifo.misses}</td><td class="code-font">${res.lru.misses}</td><td class="code-font">${res.opt.misses}</td></tr>
        <tr><td>Hits</td><td class="code-font">${res.fifo.hits}</td><td class="code-font">${res.lru.hits}</td><td class="code-font">${res.opt.hits}</td></tr>
        <tr><td>Throughput (pg/s)</td><td class="code-font">${res.fifo.throughput.toFixed(2)}</td><td class="code-font">${res.lru.throughput.toFixed(2)}</td><td class="code-font">${res.opt.throughput.toFixed(2)}</td></tr>
        </tbody>
    </table>
    <br/>
    <h3>Step-by-Step Execution Log (Reference String: ${res.refString.join(' ')})</h3>
    <div style="display:flex; gap:20px; overflow-x:auto; padding-bottom:10px;">
    `;

    // Visual Tables for each Algo
    ['FIFO', 'LRU', 'OPT'].forEach(algoKey => {
        let algoName = algoKey === 'OPT' ? 'Optimal' : algoKey;
        let data = res[algoKey.toLowerCase()];
        
        html += `<div style="flex:1; min-width:300px;">
            <h4 style="text-align:center; margin-bottom:10px; color:var(--primary);">${algoName}</h4>
            <table class="styled-table" style="font-size:0.8rem;">
                <thead><tr><th>#</th><th>Req</th><th>Frames</th><th>State</th></tr></thead>
                <tbody>`;
        
        data.steps.forEach((step, idx) => {
            let statusClass = step.status === 'Hit' ? 'hit' : 'miss';
            let frameStr = step.frames.map(f => f===-1 || f===null ? '-' : f).join(' ');
            html += `<tr>
                <td>${idx+1}</td>
                <td>${step.p}</td>
                <td style="font-family:'JetBrains Mono'">${frameStr}</td>
                <td class="${statusClass}">${step.status}</td>
            </tr>`;
        });
        
        html += `</tbody></table></div>`;
    });
    
    html += `</div>`;

    document.getElementById('matrix-body-container').innerHTML = html;
    
    if(!silent) {
        gsap.fromTo('#matrix-modal', { display: 'none', y: 50, opacity: 0 }, { display: 'block', y: 0, opacity: 1, duration: 0.5 });
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        
        Swal.fire({ icon: 'success', title: 'Analysis Complete', toast:true, position:'top-end', showConfirmButton:false, timer:3000, background: '#1f2937', color: '#f3f4f6' });
    }
}

function closeMatrix() {
    gsap.to('#matrix-modal', { duration: 0.3, opacity: 0, y: 20, onComplete: () => {
        document.getElementById('matrix-modal').style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }});
}

function UI_switchSection(curr, target) { ANIM_SwitchSection(curr, target); }

function UI_reset() {
    Swal.fire({
        title: 'Reset System?', text: "This will clear all current processes and memory.", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#4ade80', cancelButtonColor: '#ef4444',
        confirmButtonText: 'Yes, Reset', background: '#1f2937', color: '#f3f4f6'
    }).then((result) => {
        if (result.isConfirmed) {
            ANIM_SwitchSection('step-dashboard', 'step-setup');
            document.getElementById('matrix-modal').style.display = 'none';
            document.getElementById('alloc-modal').style.display = 'none';
        }
    });
}

/* ---------------------------------------------------------
   CONTIGUOUS MEMORY ALLOCATION VISUALIZER
   (First Fit, Best Fit, Worst Fit, Next Fit)
--------------------------------------------------------- */
function UI_openAllocModal() {
    const el = document.getElementById('alloc-modal');
    el.style.display = 'block';
    gsap.fromTo(el, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5 });
}

function UI_closeAllocModal() {
    const el = document.getElementById('alloc-modal');
    gsap.to(el, { opacity: 0, y: 50, duration: 0.3, onComplete: () => {
        el.style.display = 'none';
        document.getElementById('alloc-output').innerHTML = ''; // Clear old results
    }});
}

function ACTION_runAllocSim() {
    const blocksVal = document.getElementById('alloc-input-blocks').value;
    const procsVal = document.getElementById('alloc-input-procs').value;
    const algo = document.getElementById('alloc-select-algo').value;

    if(!blocksVal || !procsVal) {
        Swal.fire({ icon: 'error', title: 'Input Error', text: 'Please enter valid blocks and processes.', background: '#1f2937', color: '#f3f4f6' });
        return;
    }

    const blocks = blocksVal.trim().split(/\s+/).map(Number);
    const processes = procsVal.trim().split(/\s+/).map(Number);

    if (blocks.some(isNaN) || processes.some(isNaN)) {
        Swal.fire({ icon: 'error', title: 'Parsing Error', text: 'Only numbers allowed.', background: '#1f2937', color: '#f3f4f6' });
        return;
    }

    runAllocationLogic(blocks, processes, algo);
}

function runAllocationLogic(initialBlocks, processes, algo) {
    let blocks = [...initialBlocks]; 
    let steps = [];
    let nextFitIndex = 0;

    processes.forEach((procSize, pIdx) => {
        let chosenIndex = -1;

        if (algo === "FF") {
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i] >= procSize) { chosenIndex = i; break; }
            }
        }
        else if (algo === "BF") {
            let minGap = Infinity;
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i] >= procSize) {
                    let gap = blocks[i] - procSize;
                    if (gap < minGap) { minGap = gap; chosenIndex = i; }
                }
            }
        }
        else if (algo === "WF") {
            let maxGap = -1;
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i] >= procSize) {
                    let gap = blocks[i] - procSize;
                    if (gap > maxGap) { maxGap = gap; chosenIndex = i; }
                }
            }
        }
        else if (algo === "NF") {
            let count = 0;
            let i = nextFitIndex;
            while (count < blocks.length) {
                if (blocks[i] >= procSize) {
                    chosenIndex = i;
                    nextFitIndex = (i + 1) % blocks.length;
                    break;
                }
                i = (i + 1) % blocks.length;
                count++;
            }
        }

        let status = "Wait";
        if (chosenIndex !== -1) {
            blocks[chosenIndex] -= procSize;
            status = `Allocated (Block ${chosenIndex + 1})`;
        } else {
            status = "Not Allocated";
        }

        steps.push({ 
            processIdx: pIdx + 1,
            size: procSize,
            blockState: [...blocks], 
            status: status 
        });
    });

    renderAllocTable(initialBlocks.length, steps);
}

function renderAllocTable(blockCount, steps) {
    const container = document.getElementById('alloc-output');
    
    let headerCells = '';
    for(let i=0; i<blockCount; i++) {
        headerCells += `<th>B${i+1} Rem.</th>`;
    }

    let html = `<table class="styled-table">
        <thead>
            <tr>
                <th>Process</th>
                <th>Req Size</th>
                ${headerCells}
                <th>Status</th>
            </tr>
        </thead>
        <tbody>`;

    steps.forEach((step, i) => {
        let blockCells = step.blockState.map(val => `<td>${val}</td>`).join('');
        let color = step.status.includes('Not') ? 'var(--danger)' : 'var(--warning)';
        
        html += `<tr class="step-row" style="animation-delay: ${i * 0.1}s">
            <td>P${step.processIdx}</td>
            <td>${step.size}</td>
            ${blockCells}
            <td style="color:${color}; font-weight:bold;">${step.status}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    
    setTimeout(() => {
        document.querySelectorAll('.step-row').forEach(row => row.classList.add('show'));
    }, 100);
}