// 配置
const API_URL = 'https://robot-arm-agent-fpbggcbeod.cn-hangzhou.fcapp.run/api/plan'; // 你的 FC 公网地址

// DOM 元素
const messageList = document.getElementById('messageList');
const taskInput = document.getElementById('taskInput');
const sendBtn = document.getElementById('sendBtn');
const imageInput = document.getElementById('imageInput');
const fileNameSpan = document.getElementById('fileName');
const statusBar = document.getElementById('statusBar');
const clearBtn = document.getElementById('clearBtn');
const temperatureSlider = document.getElementById('temperature');
const tempValue = document.getElementById('tempValue');
const exampleBtns = document.querySelectorAll('.example-btn');

// 状态
let isProcessing = false;
let currentImageBase64 = null;

// --- 温度滑块 ---
temperatureSlider.addEventListener('input', () => {
    tempValue.textContent = temperatureSlider.value;
});

// --- 图片上传 ---
imageInput.addEventListener('change', function(e) {
    const file = this.files[0];
    if (file) {
        fileNameSpan.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (ev) => {
            currentImageBase64 = ev.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        fileNameSpan.textContent = '未选择文件';
        currentImageBase64 = null;
    }
});

// --- 发送消息 ---
async function sendMessage() {
    if (isProcessing) return;
    const task = taskInput.value.trim();
    if (!task) {
        setStatus('请描述任务', 'error');
        return;
    }

    // 添加用户消息到界面
    addMessage('user', task, currentImageBase64 ? { image: currentImageBase64 } : null);

    // 清空输入框，禁用按钮
    taskInput.value = '';
    sendBtn.disabled = true;
    isProcessing = true;
    setStatus('AI 思考中...', 'thinking');

    // 添加加载占位消息
    const loadingMsg = addMessage('system', '⏳ 正在规划...', null, true);

    try {
        // 构建请求参数
        const body = {
            task: task,
            imageBase64: currentImageBase64 || null,
            temperature: parseFloat(temperatureSlider.value)
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        // 移除加载消息
        loadingMsg.remove();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        // 添加AI回复
        addMessage('system', data.plan || '未收到有效回复');
        setStatus('规划完成 ✅', 'success');

        // 清空图片（可选）
        imageInput.value = '';
        fileNameSpan.textContent = '未选择文件';
        currentImageBase64 = null;

    } catch (error) {
        loadingMsg.remove();
        addMessage('system', `❌ 错误：${error.message}`);
        setStatus('请求失败', 'error');
        console.error('规划错误:', error);
    } finally {
        sendBtn.disabled = false;
        isProcessing = false;
        taskInput.focus();
        // 如果状态是thinking，重置
        if (statusBar.textContent.includes('思考')) {
            setStatus('就绪', '');
        }
    }
}

// --- 添加消息到界面 ---
function addMessage(role, content, meta = null, isLoading = false) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    if (isLoading) div.classList.add('loading');

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';
    div.appendChild(avatar);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';

    if (role === 'user' && meta?.image) {
        const img = document.createElement('img');
        img.src = meta.image;
        img.alt = '上传的图片';
        contentDiv.appendChild(img);
    }

    const textNode = document.createTextNode(content);
    contentDiv.appendChild(textNode);
    div.appendChild(contentDiv);

    messageList.appendChild(div);
    // 滚动到底部
    const container = document.getElementById('chatContainer');
    container.scrollTop = container.scrollHeight;
    return div;
}

// --- 清空对话 ---
function clearChat() {
    if (confirm('确定清空所有对话吗？')) {
        messageList.innerHTML = `
            <div class="message system">
                <div class="avatar">💡</div>
                <div class="content">对话已重置。请描述你的机械臂任务。</div>
            </div>
        `;
        setStatus('已清空', '');
    }
}

// --- 设置状态栏 ---
function setStatus(text, type = '') {
    statusBar.textContent = text;
    statusBar.style.color = type === 'error' ? '#f87171' : type === 'success' ? '#34d399' : type === 'thinking' ? '#fbbf24' : '#667a99';
}

// --- 事件绑定 ---
sendBtn.addEventListener('click', sendMessage);
taskInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') sendMessage();
});
clearBtn.addEventListener('click', clearChat);

// 快速示例填充
exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        taskInput.value = btn.textContent;
        taskInput.focus();
    });
});

// 初始状态
setStatus('就绪');
