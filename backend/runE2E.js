"use strict";
const fs = require('fs');
const problems = [
    "I need to convert PDF files into Markdown locally.",
    "I need to transcribe audio locally without sending the data to a cloud service.",
    "I need to extract information from PDF documents and then use another tool to process that extracted information."
];
async function runTests() {
    const results = [];
    for (let i = 0; i < problems.length; i++) {
        console.log(`Running Test ${i + 1}...`);
        try {
            const res = await fetch('http://localhost:3000/api/discover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problem: problems[i] })
            });
            const data = await res.json();
            results.push(data);
        }
        catch (e) {
            console.log(`Failed test ${i + 1}: ${e.message}`);
        }
    }
    fs.writeFileSync('e2e_results.json', JSON.stringify(results, null, 2));
    console.log('Saved to e2e_results.json');
}
runTests();
