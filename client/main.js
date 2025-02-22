// client/main.js
document.getElementById('run-btn').addEventListener('click', () => {
    const code = document.getElementById('code-editor').value;
    const formData = new FormData();
    formData.append('code', code);

    fetch('/run_simulation', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const consoleOutput = document.getElementById('console-output');
        if(data.error) {
            consoleOutput.textContent = "エラー: " + data.error;
            return;
        }
        consoleOutput.textContent = data.output;

        if(data.result && data.result.time && data.result.position) {
            renderChart(data.result.time, data.result.position);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

let chartInstance = null;
function renderChart(timeData, positionData) {
    const ctx = document.getElementById('simulation-chart').getContext('2d');

    // 既存のグラフがあれば破棄
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeData,
            datasets: [{
                label: '位置',
                data: positionData,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '時間 (s)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '位置 (m)'
                    }
                }
            }
        }
    });
}
