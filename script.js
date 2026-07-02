// public/script.js - 机械臂规划前端逻辑（无密钥版）

const taskInput = document.getElementById('taskInput');
const imageInput = document.getElementById('imageInput');
const fileNameSpan = document.getElementById('fileName');
const imagePreview = document.getElementById('imagePreview');
const planBtn = document.getElementById('planBtn');
const resultDiv = document.getElementById('result');
const statusDiv = document.getElementById('status');

// --- 图片上传预览 ---
imageInput.addEventListener('change', function(e) {
    const file = this.files[0];
    if (file) {
        fileNameSpan.textContent = file.name;
        // 显示预览图
        const reader = new FileReader();
        reader.onload = function(ev) {
            imagePreview.innerHTML = `<img src="${ev.target.result}" alt="场景预览" />`;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        fileNameSpan.textContent = '未选择文件';
        imagePreview.style.display = 'none';
    }
});

// --- 快捷键：Ctrl + Enter 生成 ---
taskInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        generatePlan();
    }
});

// --- 生成规划主函数 ---
planBtn.addEventListener('click', generatePlan);

async function generatePlan() {
    const task = taskInput.value.trim();
    if (!task) {
        setStatus('⚠️ 请先描述机械臂任务', 'error');
        taskInput.focus();
        return;
    }

    // 启用加载状态
    planBtn.disabled = true;
    planBtn.textContent = '⏳ 规划中...';
    resultDiv.textContent = '🤔 AI 正在分析任务并规划动作...';
    resultDiv.className = 'result-box loading';
    setStatus('🔄 正在请求后端服务，请稍候...', '');

    try {
        // 1. 处理图片（如果有）
        let imageBase64 = null;
        if (imageInput.files && imageInput.files.length > 0) {
            const file = imageInput.files[0];
            imageBase64 = await fileToBase64(file);
        }

        // 2. 调用后端 API（安全代理）
        const response = await fetch('https://robot-arm-agent-fpbggcbeod.cn-hangzhou.fcapp.run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task: task,
                imageBase64: imageBase64
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `请求失败 (HTTP ${response.status})`);
        }

        // 3. 显示规划结果
        resultDiv.textContent = data.plan;
        resultDiv.className = 'result-box';
        setStatus('✅ 规划生成成功！', 'success');

    } catch (error) {
        console.error('规划生成错误:', error);
        resultDiv.textContent = `❌ 生成规划时出错：\n${error.message}`;
        resultDiv.className = 'result-box';
        setStatus('❌ 任务失败，请检查网络或稍后重试', 'error');
    } finally {
        // 恢复按钮
        planBtn.disabled = false;
        planBtn.textContent = '🚀 生成动作规划';
    }
}

// --- 工具函数：文件转 Base64 ---
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

// --- 设置状态信息 ---
function setStatus(message, type = '') {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
}
