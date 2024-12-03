// 初始化全局变量
const ctx = document.getElementById('heartRateChart').getContext('2d');
let heartData_global = '';  // 保存心率数据（字符串）
let heartRateValues = [];  // 保存心率数据（数字数组）
let analysisData = null;    // 保存分析数据
let haveAnalysisDataWithoutDownload = false;  // 保存是否有分析数据但未下载
let requestTime = 0;  // 保存当前请求的时间戳
const heartRateChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // 初始化为空
        datasets: [{
            label: '心率',
            data: [], // 初始化为空
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// 涉及到滑块颜色的函数
function updateBarColor(barId, lowThreshold, highThreshold) {
    const bar = document.getElementById(barId);
    const value = parseFloat(bar.value); // 获取滑块的值
    let color;
    // 如果barID是SN，逻辑不一样，只是SN特别高才会表示人状态糟糕
    if(barId === 'snPercent'){
        if (value === 0) {
            color = '#777'; // 灰色，表示当前状态为0
        }else if (value > highThreshold) {
            color = '#f00'; // 高于阈值，显示红色
        } else {
            color = '#00f'; // 正常范围内显示蓝色
        }
    }else{
        if (value === 0) {
            color = '#777'; // 灰色，表示当前状态为0
        } else if (value < lowThreshold) {
            color = '#f00'; // 低于阈值，显示红色
        } else if (value > highThreshold) {
            color = '#0f0'; // 高于阈值，显示绿色
        } else {
            color = '#00f'; // 正常范围内显示蓝色
        } 
    }
    const percentage = 100*(value-bar.min)/(bar.max-bar.min);
    // 使用 linear-gradient 设置背景颜色：左侧为指定颜色，右侧为灰色
    bar.style.background = `linear-gradient(to right, ${color} ${percentage}%, #ccc ${percentage}%)`;
    // 更新滑块的拇指颜色，以与左侧填充颜色一致
    bar.style.setProperty('--thumb-color', color);
    // 显示数值在滑块上
    bar.title = `${value}`;
}

// 初始化滑块颜色
window.onload = () => {
    updateBarColor('rmssdPercent', 15, 39);
    updateBarColor('sdnnPercent', 102, 180);
    updateBarColor('pnn50Percent', 2, 8);
    updateBarColor('snPercent',7, 15);
};

// 从后端获取并显示分析数据
function updateAnalysisData(data) {
    // 更新图表
    // 获取心率数据并转换为数字数组
    heartRateValues = heartData_global.split(",").map(value => parseFloat(value.trim()));
    // 生成横轴数据（时间轴）
    const timeLabels = Array.from({ length: heartRateValues.length }, (_, i) => i + 1); 
    // 将解析后的数据传给绘图函数
    heartRateChart.data.labels = timeLabels;  // 横轴时间标签
    heartRateChart.data.datasets[0].data = heartRateValues;  // 纵轴心率数据
    heartRateChart.update();  // 更新图表

    // 更新分析数据
    document.getElementById('rmssdPercent').value = data["RMSSD"];
    document.getElementById('sdnnPercent').value = data["SDNN"];
    document.getElementById('pnn50Percent').value = data["pNN50"];
    document.getElementById('snPercent').value = data["SN"];

    document.getElementById('totalEnergy').textContent = '⭐'.repeat(data["总能量星级"]);
    document.getElementById('relaxation').textContent = '⭐'.repeat(data["放松度星级"]);
    document.getElementById('stressIndex').textContent = '⭐'.repeat(data["压力指数星级"]);
    document.getElementById('emotionStability').textContent = '⭐'.repeat(data["情绪稳定性星级"]);  
    document.getElementById('moodColor').style.backgroundColor = data["心情颜色"];
    document.getElementById('moodStatus').textContent = data["心情状态"];
    document.getElementById('psychologicalResilience').textContent = '⭐'.repeat(data["心理弹性星级"]);
    document.getElementById('physicalMentalHarmony').textContent = '⭐'.repeat(data["身心和谐度星级"]);
    document.getElementById('overallScore').textContent = data["综合得分"];
    document.getElementById('anxietyIndex').textContent = '⭐'.repeat(data["焦虑指数"]);
    document.getElementById('fatigueIndex').textContent = '⭐'.repeat(data["疲劳指数"]);
    document.getElementById('suggestionsText').textContent = data["建议"];
    document.getElementById('timespan').textContent = `${heartRateValues.length}秒`;

    haveAnalysisDataWithoutDownload = true;
    
    // 更新滑块颜色
    updateBarColor('rmssdPercent', 15, 39);
    updateBarColor('sdnnPercent', 102, 180);
    updateBarColor('pnn50Percent', 2, 8);
    updateBarColor('snPercent',7, 15);
}
// 
function downloadReport(data) {
    const report = `
        报告生成时间：${new Date(requestTime).toLocaleString()}
        RMSSD: ${data["RMSSD"]}
        SDNN: ${data["SDNN"]}
        PNN50: ${data["pNN50"]}
        SN: ${data["SN"]}
        总能量星级: ${'⭐'.repeat(data["总能量星级"])}
        放松度星级: ${'⭐'.repeat(data["放松度星级"])}
        压力指数星级: ${'⭐'.repeat(data["压力指数星级"])}
        情绪稳定性星级: ${'⭐'.repeat(data["情绪稳定性星级"])}
        心情颜色: ${data["心情颜色"]}
        心情状态: ${data["心情状态"]}
        心理弹性星级: ${'⭐'.repeat(data["心理弹性星级"])}
        身心和谐度星级: ${'⭐'.repeat(data["身心和谐度星级"])}
        综合得分: ${ data["综合得分"]} 
        焦虑指数: ${'⭐'.repeat(data["焦虑指数"])}
        疲劳指数: ${'⭐'.repeat(data["疲劳指数"])} 
        心率时长：${heartRateValues.length}秒
        建议: ${ data["建议"]}
    `;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${new Date(requestTime).toLocaleString()}_心率分析报告.txt`;
    a.click();
    URL.revokeObjectURL(url);
    haveAnalysisDataWithoutDownload = false;
}

const fileUpload = document.getElementById('fileUpload');
const suggestionsText = document.getElementById('suggestionsText');
const downloadButton = document.getElementById('downloadButton');

// 确保点击上传按钮时文本输入框被触发
document.querySelector('.custom-file-upload').addEventListener('click', function() {
     
    fileUpload.click();
});

// 点击上传文件时触发
fileUpload.addEventListener('click', function (event) {
    /**
     * 先检测现在网页上是否有数据并且用户未下载，如果有数据并且用户未下载，提示用户下载
     */
    if (haveAnalysisDataWithoutDownload) {
        // 提问用户：检测到您未下载当前报告，是否继续？
        const downloadConfirm = confirm('检测到您未下载当前报告，是否先下载当前报告？');
        if (downloadConfirm) {
            downloadReport(analysisData);
        } 
    }
});

// 显示模态框
function showLoadingModal() {
    const loadingModal = document.getElementById('loadingModal');
    loadingModal.style.display = 'flex';
}

// 隐藏模态框
function hideLoadingModal() {
    const loadingModal = document.getElementById('loadingModal');
    loadingModal.style.display = 'none';
}


// 选择文件后触发
fileUpload.addEventListener('change', function () {
    
    const file = fileUpload.files[0];
    if (!file) return;  // 如果没有选择文件，直接返回
    // 读取文件内容并将其作为心率数据发送到后端

    showLoadingModal(); // 显示模态框
    requestTime = Date.now();  // 记录请求时间戳

    const reader = new FileReader();
    
    reader.onload = function(event) {
        const heartRateData = event.target.result;
        heartData_global = heartRateData;
        fetch('http://36.103.203.203:28479/api/v1/chat/completions', {  // 修改请求路径指向远程服务器的API端口
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ heart_rate_series: heartRateData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("大模型请求失败，请检查您的数据格式是否正确！\n错误日志为：", str(data.error));
                console.error('Error:', data.error);
            } else { 
                analysisData = data;
                updateAnalysisData(analysisData);
            }
        })
        .catch(error => {
            alert("服务器连接失败，请检查后端服务是否正常！\n错误日志为：", error);
            console.error('Error:', error);
        })
        .finally(() => {
            hideLoadingModal(); // 隐藏模态框
        });
    };
    reader.readAsText(file);  // 将文件内容读取为文本
});

downloadButton.addEventListener('click', function() {
    
    if (analysisData) {
        downloadReport(analysisData);
    } else {
        alert('您尚未上传数据或数据解析失败，无法下载分析数据。');
        console.error('No analysis data available for download.');
    }
});


/**
 * 新增的 infoButton模态框
 */
const infoButton = document.getElementById('infoButton');
const infoModal = document.getElementById('infoModal');
const closeModal = document.getElementById('closeModal');

// 点击“指标说明”按钮时，显示模态框
infoButton.addEventListener('click', function () {
    infoModal.style.display = 'flex';
});

// 点击“关闭”按钮时，隐藏模态框
closeModal.addEventListener('click', function () {
    infoModal.style.display = 'none';
});

// 点击模态框外部区域时，隐藏模态框
window.addEventListener('click', function (event) {
    if (event.target === infoModal) {
        infoModal.style.display = 'none';
    }
});
