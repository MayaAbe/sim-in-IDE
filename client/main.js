// client/main.js

let chartInstance = null;
let simulationData = null;
let currentMode = 'static'; // 'static' または 'animation'
let animationInterval = null;
let animationPlaying = false;
let currentAnimationIndex = 0;
let playbackSpeed = 1.0;  // 再生速度（デフォルト1.0x）

// Runボタンのイベント
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
            simulationData = data.result; // グローバルに保存
            // スライダーの設定（秒数表示）
            const timeSlider = document.getElementById('time-slider');
            timeSlider.min = simulationData.time[0];
            timeSlider.max = simulationData.time[simulationData.time.length - 1];
            timeSlider.step = (simulationData.time[1] - simulationData.time[0]).toFixed(3);
            timeSlider.value = simulationData.time[0];
            // 初期描画：現在のモードに応じて描画
            if(currentMode === 'static') {
                renderStaticChart(simulationData.time, simulationData.position);
            } else {
                renderAnimatedChart(simulationData.time, simulationData.position);
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// クリアボタンのイベント
document.getElementById('clear-btn').addEventListener('click', () => {
    // コンソールクリア
    document.getElementById('console-output').textContent = "";
    // アニメーション停止
    stopAnimation();
    // グラフ削除
    if(chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
});

// モード切替ボタンのイベント
document.getElementById('mode-toggle-btn').addEventListener('click', () => {
    if (!simulationData) {
        alert("まずシミュレーションを実行してください。");
        return;
    }
    // もしアニメーション再生中なら停止
    stopAnimation();

    if(currentMode === 'static'){
        currentMode = 'animation';
        document.getElementById('mode-toggle-btn').textContent = "静的グラフ表示";
        document.getElementById('animation-controls').style.display = "block";
        renderAnimatedChart(simulationData.time, simulationData.position);
    } else {
        currentMode = 'static';
        document.getElementById('mode-toggle-btn').textContent = "アニメーション表示";
        document.getElementById('animation-controls').style.display = "none";
        renderStaticChart(simulationData.time, simulationData.position);
    }
});

// 再生/一時停止ボタンのイベント
document.getElementById('play-pause-btn').addEventListener('click', () => {
    if(!animationPlaying){
        startAnimation();
        document.getElementById('play-pause-btn').textContent = "一時停止";
    } else {
        stopAnimation();
        document.getElementById('play-pause-btn').textContent = "再生";
    }
});

// スライダーのイベント（時刻スライダー）
document.getElementById('time-slider').addEventListener('input', (event) => {
    if(!simulationData || !chartInstance) return;
    const sliderTime = parseFloat(event.target.value);
    // time配列から、sliderTimeに最も近いインデックスを求める
    let index = simulationData.time.findIndex(t => t >= sliderTime);
    if(index === -1) {
        index = simulationData.time.length - 1;
    }
    currentAnimationIndex = index;
    updateMarker(simulationData.time, simulationData.position, index);
    document.getElementById('current-time').textContent = sliderTime.toFixed(2) + " s";
});

// 再生速度スライダーのイベント
document.getElementById('speed-slider').addEventListener('input', (event) => {
    playbackSpeed = parseFloat(event.target.value);
    document.getElementById('speed-value').textContent = playbackSpeed.toFixed(1) + "x";
});

// 静的グラフ描画関数
function renderStaticChart(timeData, positionData) {
    if (chartInstance) {
        chartInstance.destroy();
    }
    const ctx = document.getElementById('simulation-chart').getContext('2d');
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

// アニメーション用グラフ描画関数
function renderAnimatedChart(timeData, positionData) {
    if(chartInstance) {
        chartInstance.destroy();
    }
    const ctx = document.getElementById('simulation-chart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeData,
            datasets: [
                {
                    label: '位置',
                    data: positionData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: '現在位置',
                    data: [{x: timeData[0], y: positionData[0]}],
                    borderColor: 'red',
                    backgroundColor: 'red',
                    pointRadius: 6,
                    type: 'scatter',
                    showLine: false
                }
            ]
        },
        options: {
            animation: { duration: 0 },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '時間 (s)'
                    },
                    type: 'linear',
                    position: 'bottom'
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
    currentAnimationIndex = 0;
}

// マーカー更新関数
function updateMarker(timeData, positionData, index) {
    if(!chartInstance) return;
    chartInstance.data.datasets[1].data = [{ x: timeData[index], y: positionData[index] }];
    chartInstance.update();
}

// アニメーション再生開始
function startAnimation() {
    if(animationInterval) clearInterval(animationInterval);
    animationPlaying = true;
    animationInterval = setInterval(() => {
        if(!simulationData) return;
        const maxTime = simulationData.time[simulationData.time.length - 1];
        let currentTime = parseFloat(document.getElementById('time-slider').value);
        const dtAdvance = 0.05 * playbackSpeed;  // 50ms間隔で進むシミュレーション時間（秒）
        currentTime += dtAdvance;
        if(currentTime > maxTime) {
            currentTime = simulationData.time[0];
        }
        document.getElementById('time-slider').value = currentTime;
        document.getElementById('current-time').textContent = currentTime.toFixed(2) + " s";
        let index = simulationData.time.findIndex(t => t >= currentTime);
        if(index === -1) {
            index = simulationData.time.length - 1;
        }
        currentAnimationIndex = index;
        updateMarker(simulationData.time, simulationData.position, index);
    }, 50);
}

// アニメーション停止
function stopAnimation() {
    animationPlaying = false;
    if(animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    document.getElementById('play-pause-btn').textContent = "再生";
}
