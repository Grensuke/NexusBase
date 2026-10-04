"use strict";
const problem = "I need to convert PDF documents containing charts and math formulas into markdown. It must run completely locally, offline.";
async function test() {
    console.log("Checking health...");
    const health = await fetch('http://localhost:3000/api/health');
    console.log(await health.json());
    console.log("Testing discover...");
    const res = await fetch('http://localhost:3000/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem })
    });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
}
test();
