document.getElementById('contractFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const uploadLabel = document.getElementById('uploadLabel');
    const spinner = document.getElementById('spinner');

    try {
        // Disable upload button and show spinner
        uploadLabel.classList.add('opacity-50', 'cursor-not-allowed');
        uploadLabel.setAttribute('for', '');
        spinner.style.display = 'inline-block';

        const contractContent = await file.text();
        const response = await axios.post('/scan', {
            contractContent: contractContent,
            fileName: file.name
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        displayContractCode(contractContent, response.data.vulnerabilities);
        displayResults(response.data);
        document.getElementById('clearResults').classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    } finally {
        // Re-enable upload button and hide spinner
        uploadLabel.classList.remove('opacity-50', 'cursor-not-allowed');
        uploadLabel.setAttribute('for', 'contractFile');
        spinner.style.display = 'none';
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
        `<div class="code-line ${highlightedLines.has(index) ? 'bg-red-800 text-white' : ''}">
            <span class="line-number">${index + 1}</span>
            <span class="line-content">${line}</span>
         </div>`
    ).join('');

    codeElement.innerHTML = highlightedCode;
    document.getElementById('contractCode').classList.remove('hidden');
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (data.vulnerabilities.length === 0) {
        resultsDiv.innerHTML = '<p class="text-green-500 font-bold text-xl">No vulnerabilities found.</p>';
        return;
    }

    data.vulnerabilities.forEach(vuln => {
        const vulnDiv = document.createElement('div');
        vulnDiv.className = 'mb-8 p-6 bg-white rounded-lg shadow-md border-l-4 border-red-500';

        const severityColor = vuln.severity === 'Critical' ? 'text-red-600' : 
                              vuln.severity === 'High' ? 'text-orange-500' :
                              vuln.severity === 'Medium' ? 'text-yellow-500' : 'text-blue-500';

        vulnDiv.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800">${vuln.name}</h2>
                <span class="px-3 py-1 ${severityColor} font-semibold rounded-full bg-gray-100">
                    ${vuln.severity}
                </span>
            </div>
            <p class="text-gray-600 mb-4">${vuln.description}</p>
            ${vuln.staticAnalysis ? `
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Static Analysis:</h3>
                    ${vuln.staticAnalysis.findings.map(finding => `
                        <div class="bg-gray-50 p-3 rounded mb-2">
                            <pre class="text-sm overflow-x-auto">${finding.match}</pre>
                            <p class="text-sm text-gray-500 mt-1">Line: ${finding.lineNumber}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            ${vuln.dynamicAnalysis ? `
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Dynamic Analysis:</h3>
                    <div class="bg-gray-50 p-4 rounded">
                        <p class="text-sm mb-2">
                            <span class="font-semibold">Result:</span> 
                            <span class="${vuln.dynamicAnalysis.result === 'Vulnerable' ? 'text-red-500' : 'text-green-500'}">
                                ${vuln.dynamicAnalysis.result}
                            </span>
                        </p>
                        ${vuln.dynamicAnalysis.error ? `
                            <p class="text-sm text-red-500">
                                <span class="font-semibold">Error:</span> ${vuln.dynamicAnalysis.error}
                            </p>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            ${vuln.mitigation ? `
                <div class="mt-4">
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Mitigation:</h3>
                    <ul class="list-disc list-inside text-gray-600">
                        ${vuln.mitigation.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${vuln.reference ? `
                <div class="mt-4">
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Reference:</h3>
                    <a href="${vuln.reference}" target="_blank" class="text-blue-500 hover:underline">${vuln.reference}</a>
                </div>
            ` : ''}
        `;

        resultsDiv.appendChild(vulnDiv);
    });
}
