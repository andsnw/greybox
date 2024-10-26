document.getElementById('contractFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('contract', file);

    try {
        const response = await axios.post('/scan', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        displayContractCode(await file.text(), response.data.vulnerabilities);
        displayResults(response.data);
        document.getElementById('clearResults').classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
});

document.getElementById('clearResults').addEventListener('click', async () => {
    try {
        await axios.post('/clear');
        clearResults();
    } catch (error) {
        console.error('Error clearing results:', error);
    }
});

function clearResults() {
    document.getElementById('contractCode').classList.add('hidden');
    document.getElementById('results').innerHTML = '';
    document.getElementById('clearResults').classList.add('hidden');
    document.getElementById('contractFile').value = '';
}

function displayContractCode(code, vulnerabilities) {
    const codeElement = document.querySelector('#contractCode code');
    codeElement.textContent = code;
    hljs.highlightElement(codeElement);

    const lines = code.split('\n');
    const highlightedLines = new Set();

    vulnerabilities.forEach(vuln => {
        if (vuln.staticAnalysis && vuln.staticAnalysis.findings) {
            vuln.staticAnalysis.findings.forEach(finding => {
                if (finding.lineNumber) {
                    highlightedLines.add(finding.lineNumber - 1);
                }
            });
        }
    });

    const highlightedCode = lines.map((line, index) =>
        highlightedLines.has(index)
            ? `<span class="bg-yellow-200">${line}</span>`
            : line
    ).join('\n');

    codeElement.innerHTML = highlightedCode;
    document.getElementById('contractCode').classList.remove('hidden');
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (data.vulnerabilities.length === 0) {
        resultsDiv.innerHTML = '<p class="text-green-500">No vulnerabilities found.</p>';
        return;
    }

    data.vulnerabilities.forEach(vuln => {
        const vulnDiv = document.createElement('div');
        vulnDiv.className = 'mb-4 p-4 bg-white rounded shadow';

        vulnDiv.innerHTML = `
            <h2 class="text-xl font-bold">${vuln.name}</h2>
            <p class="text-gray-700">${vuln.description}</p>
            <p class="text-sm text-gray-500">Severity: ${vuln.severity}</p>
            ${vuln.staticAnalysis ? `
                <div class="mt-2">
                    <p class="font-semibold">Static Analysis:</p>
                    ${vuln.staticAnalysis.findings.map(finding => `
                        <pre class="bg-gray-100 p-2 rounded mt-1">${finding.match}</pre>
                        <p class="text-sm text-gray-500">Line: ${finding.lineNumber}</p>
                    `).join('')}
                </div>
            ` : ''}
            ${vuln.dynamicAnalysis ? `
                <div class="mt-2">
                    <p class="font-semibold">Dynamic Analysis:</p>
                    <p class="text-sm text-gray-500">Result: ${vuln.dynamicAnalysis.result}</p>
                    ${vuln.dynamicAnalysis.error ? `<p class="text-sm text-red-500">Error: ${vuln.dynamicAnalysis.error}</p>` : ''}
                </div>
            ` : ''}
            ${vuln.mitigation ? `
                <div class="mt-2">
                    <p class="font-semibold">Mitigation:</p>
                    <ul class="list-disc list-inside">
                        ${vuln.mitigation.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${vuln.reference ? `
                <div class="mt-2">
                    <p class="font-semibold">Reference:</p>
                    <a href="${vuln.reference}" target="_blank" class="text-blue-500 hover:underline">${vuln.reference}</a>
                </div>
            ` : ''}
        `;

        resultsDiv.appendChild(vulnDiv);
    });
}
