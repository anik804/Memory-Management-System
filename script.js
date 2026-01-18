
        const mode = document.getElementById("mode");
        const input1 = document.getElementById("input1");
        const input2 = document.getElementById("input2");
        const algorithm = document.getElementById("algorithm");
        const output = document.getElementById("output");
        const summary = document.getElementById("summary");

        /* ---------- MODE SWITCH ---------- */
        function toggleMode() {
            algorithm.innerHTML = "";
            if (mode.value === "page") {
                input1.placeholder = "Reference string (7 0 1 2 0 3)";
                input2.placeholder = "Number of frames";
                algorithm.innerHTML = `
            <option value="FIFO">FIFO</option>
            <option value="LRU">LRU</option>
            <option value="OPT">Optimal</option>
            <option value="SC">Second Chance</option>`;
            } else {
                input1.placeholder = "Block sizes (100 500 200 300 600)";
                input2.placeholder = "Process sizes (212 417 112 426)";
                algorithm.innerHTML = `
            <option value="FF">First Fit</option>
            <option value="BF">Best Fit</option>
            <option value="WF">Worst Fit</option>
            <option value="NF">Next Fit</option>`;
            }
        }
        toggleMode();

        /* ---------- SIMULATE ---------- */
        function simulate() {
            output.innerHTML = "";
            summary.innerHTML = "";
            if (mode.value === "page") pageReplacement();
            else memoryAllocation();
        }

        /* ---------- PAGE REPLACEMENT ---------- */
        function pageReplacement() {
            const ref = input1.value.split(" ").map(Number);
            const frameCount = parseInt(input2.value);
            const algo = algorithm.value;

            let frames = Array(frameCount).fill(null);
            let refBits = Array(frameCount).fill(0);
            let fifo = 0, hits = 0, misses = 0;
            let steps = [];

            ref.forEach((p, i) => {
                let status = "Hit";
                if (frames.includes(p)) {
                    hits++;
                    if (algo === "SC") refBits[frames.indexOf(p)] = 1;
                } else {
                    misses++; status = "Miss";
                    if (algo === "FIFO") {
                        frames[fifo] = p;
                        fifo = (fifo + 1) % frameCount;
                    }
                    else if (algo === "LRU") {
                        let idx = 0, min = 1e9;
                        frames.forEach((f, j) => {
                            let last = ref.slice(0, i).lastIndexOf(f);
                            if (last < min) { min = last; idx = j; }
                        });
                        frames[idx] = p;
                    }
                    else if (algo === "OPT") {
                        let idx = 0, far = -1;
                        frames.forEach((f, j) => {
                            let nxt = ref.slice(i + 1).indexOf(f);
                            if (nxt === -1) { idx = j; far = 1e9; }
                            else if (nxt > far) { far = nxt; idx = j; }
                        });
                        frames[idx] = p;
                    }
                    else if (algo === "SC") {
                        while (true) {
                            if (frames[fifo] === null || refBits[fifo] === 0) {
                                frames[fifo] = p;
                                refBits[fifo] = 1;
                                fifo = (fifo + 1) % frameCount;
                                break;
                            }
                            refBits[fifo] = 0;
                            fifo = (fifo + 1) % frameCount;
                        }
                    }
                }
                steps.push({ p, frames: [...frames], refBits: [...refBits], status });
            });

            renderTable("Page", frameCount, steps, true);
            showSummary(hits, misses);
        }

        /* ---------- MEMORY ALLOCATION (MULTIPLE PROCESS) ---------- */
        function memoryAllocation() {
            const blocks = input1.value.split(" ").map(Number);
            const processes = input2.value.split(" ").map(Number);
            const algo = algorithm.value;

            let memory = [...blocks];
            let steps = [];
            let nextFitIndex = 0;

            processes.forEach(proc => {
                let chosen = -1;

                if (algo === "FF") {
                    for (let i = 0; i < memory.length; i++)
                        if (memory[i] >= proc) { chosen = i; break; }
                }
                else if (algo === "BF") {
                    let min = 1e9;
                    for (let i = 0; i < memory.length; i++)
                        if (memory[i] >= proc && memory[i] < min) {
                            min = memory[i]; chosen = i;
                        }
                }
                else if (algo === "WF") {
                    let max = -1;
                    for (let i = 0; i < memory.length; i++)
                        if (memory[i] >= proc && memory[i] > max) {
                            max = memory[i]; chosen = i;
                        }
                }
                else if (algo === "NF") {
                    let count = 0, i = nextFitIndex;
                    while (count < memory.length) {
                        if (memory[i] >= proc) {
                            chosen = i;
                            nextFitIndex = (i + 1) % memory.length;
                            break;
                        }
                        i = (i + 1) % memory.length;
                        count++;
                    }
                }

                let status = "Not Allocated";
                if (chosen !== -1) {
                    memory[chosen] -= proc;
                    status = "Allocated";
                }

                steps.push({ p: proc, frames: [...memory], status });
            });

            renderTable("Process", memory.length, steps, false);
        }

        /* ---------- RENDER TABLE ---------- */
        function renderTable(title, count, steps, isPage) {
            let html = "<table><tr><th>" + title + "</th>";
            for (let i = 0; i < count; i++) html += `<th>Slot ${i + 1}</th>`;
            html += "<th>Status</th></tr></table>";

            output.innerHTML = html;
            const table = document.querySelector("table");

            steps.forEach((s, i) => {
                setTimeout(() => {
                    const row = document.createElement("tr");
                    row.className = "step-row";
                    row.innerHTML = `<td>${s.p}</td>`;
                    s.frames.forEach((f, j) => {
                        if (isPage && algorithm.value === "SC")
                            row.innerHTML += `<td>${f ?? "-"}<span class="ref-bit">R=${s.refBits[j]}</span></td>`;
                        else row.innerHTML += `<td>${f}</td>`;
                    });
                    row.innerHTML += `<td class="${s.status === "Hit" || s.status === "Allocated" ? "hit" : "miss"}">${s.status}</td>`;
                    table.appendChild(row);
                    requestAnimationFrame(() => row.classList.add("show"));
                }, i * 900);
            });
        }

        /* ---------- SUMMARY ---------- */
        function showSummary(h, m) {
            let t = h + m;
            summary.innerHTML = `
        Hits: ${h} | Misses: ${m}<br>
        Hit Ratio: ${(h / t).toFixed(2)} |
        Miss Ratio: ${(m / t).toFixed(2)}
    `;
        }