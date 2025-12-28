// --- 初期設定データ ---
const defaultItems = [
    { name: "500円", color: "#aed581", visual_weight: 5, real_weight: 5, split_count: 5, message: "おめでとう！" },
    { name: "1000円", color: "#4fc3f7", visual_weight: 4, real_weight: 4, split_count: 4, message: "やったね！" },
    { name: "3000円", color: "#fff176", visual_weight: 3, real_weight: 3, split_count: 3, message: "すごい！" },
    { name: "5000円", color: "#ff8a65", visual_weight: 2, real_weight: 2, split_count: 2, message: "大当たり！" },
    { name: "1万円", color: "#e57373", visual_weight: 1, real_weight: 1, split_count: 1, message: "神引き！！" }
];

// --- グローバル変数 ---
const SPIN_SPEED = 10;
const DECEL_DURATION = 5000;
const MIN_ROTATIONS = 4;

let items = [];
let displaySlices = []; 
let canvas, ctx;
let currentAngle = 0; 
let isSpinning = false;
let animationFrameId;

let layoutMode = 'random'; 

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let drumBuffer = null;
let fanfareBuffer = null;
let drumSource = null;

const urlParams = new URLSearchParams(window.location.search);
const isSecretMode = urlParams.get('mode') === 'secret';

window.onload = () => {
    canvas = document.getElementById('rouletteCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    // ロード時とリサイズ時にサイズ調整を実行
    handleResize();
    window.addEventListener('resize', () => {
        handleResize();
        drawWheel(); // リサイズ直後に再描画を強制
    });

    if (isSecretMode) {
        const helpList = document.getElementById('helpList');
        if (helpList) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>裏確率:</strong> 見た目の面積に関わらず、抽選に使用される「真の確率」を設定できます。<span style="background:#ffebee;">赤背景の入力欄</span>です。`;
            helpList.appendChild(li);
        }
    }

    loadSettings();

    document.getElementById('spinBtn').onclick = startSpin;
    document.getElementById('stopBtn').onclick = stopSpin;
    document.querySelector('.close').onclick = closeModal;
    
    document.getElementById('saveSettingsBtn').onclick = saveSettingsFromUI;
    document.getElementById('addItemBtn').onclick = () => addSettingRow();
    document.getElementById('resetSettingsBtn').onclick = () => {
        if(confirm("設定を初期化しますか？")) {
            items = JSON.parse(JSON.stringify(defaultItems));
            saveSettings();
            generateDisplaySlices();
            renderSettingsUI();
            drawWheel();
        }
    };
    
    document.getElementById('btnShuffleAdmin').onclick = () => changeLayout('random');
    document.getElementById('btnDistributeAdmin').onclick = () => changeLayout('distributed');

    loadAudioFiles();
};

// リサイズ処理
function handleResize() {
    if (!canvas || !ctx) return;
    
    // 現在の表示サイズ（CSSで決まったpx値）を取得
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // キャンバスの内部解像度をセット（描画バッファのサイズ変更）
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // ※ ctx.scale は使いません。drawWheel側で座標計算します。
    
    // サイズ変更直後に再描画
    drawWheel();
}

function changeLayout(mode) {
    layoutMode = mode;
    generateDisplaySlices();
    drawWheel();
}

function generateDisplaySlices() {
    displaySlices = [];
    
    let pool = [];
    items.forEach((item, index) => {
        const count = parseInt(item.split_count) || 1;
        const weightPerSlice = parseFloat(item.visual_weight) / count;
        
        for (let i = 0; i < count; i++) {
            pool.push({
                originalIndex: index,
                name: item.name,
                color: item.color,
                weight: weightPerSlice
            });
        }
    });

    if (layoutMode === 'random') {
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        displaySlices = pool;
    } else {
        const buckets = items.map(() => []);
        pool.forEach(slice => {
            buckets[slice.originalIndex].push(slice);
        });
        
        displaySlices = [];
        let maxLen = Math.max(...buckets.map(b => b.length));
        
        for (let i = 0; i < maxLen; i++) {
            for (let b = 0; b < buckets.length; b++) {
                if (buckets[b].length > i) {
                    displaySlices.push(buckets[b][i]);
                }
            }
        }
    }
}

function drawWheel() {
    if (!canvas || !ctx) return;
    
    // 現在のキャンバスの実サイズを取得
    const width = canvas.width;
    const height = canvas.height;
    
    // 中心点と半径を動的に計算
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 半径は「幅か高さの小さい方」の半分。少し余白(15px相当)を持たせる
    // 比率で計算：(サイズ / 2) * 0.9 くらいにする
    const radius = (Math.min(width, height) / 2) * 0.92;

    const totalWeight = displaySlices.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight <= 0) return;

    // 描画エリアをクリア（重要：サイズ変更時のゴミ残り防止）
    ctx.clearRect(0, 0, width, height);

    let startAngle = (currentAngle % 360) * Math.PI / 180;

    displaySlices.forEach(slice => {
        const sliceAngle = (slice.weight / totalWeight) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.fillStyle = slice.color;
        ctx.fill();
        
        ctx.lineWidth = width * 0.005; // 線の太さもサイズに合わせて微調整（約2px〜）
        ctx.strokeStyle = "#fff";
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        
        // フォントサイズも動的に計算 (半径の10%くらい)
        const fontSize = Math.max(14, radius * 0.12);
        ctx.font = `bold ${fontSize}px 'Yusei Magic', Arial`;
        
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // 文字配置位置（半径より少し内側）
        ctx.fillText(slice.name, radius * 0.85, fontSize * 0.35);
        ctx.restore();

        startAngle += sliceAngle;
    });
    
    // 中央ピン
    ctx.beginPath();
    // ピンのサイズも少し動的に
    const pinRadius = Math.max(10, radius * 0.08);
    ctx.arc(centerX, centerY, pinRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = pinRadius * 0.3;
    ctx.strokeStyle = "#d32f2f";
    ctx.stroke();
}

function startSpin() {
    if (isSpinning) return;
    initAudio();
    playDrum();
    isSpinning = true;
    document.getElementById('spinBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    function spinLoop() {
        try {
            currentAngle += SPIN_SPEED;
            drawWheel();
            if (isSpinning) {
                animationFrameId = requestAnimationFrame(spinLoop);
            }
        } catch (e) { console.error(e); }
    }
    spinLoop();
}

async function stopSpin() {
    document.getElementById('stopBtn').disabled = true;
    try {
        const response = await fetch('/api/spin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ items: items, is_secret: isSecretMode })
        });
        if (!response.ok) throw new Error("API Error");
        const result = await response.json();
        startDeceleration(result.winner_index);
    } catch (e) {
        console.error(e);
        alert("通信エラーが発生しました");
        finishSpin(null);
    }
}

function startDeceleration(winnerOriginalIndex) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    const candidates = [];
    const totalWeight = displaySlices.reduce((sum, s) => sum + s.weight, 0);
    let angleAccumulator = 0;
    displaySlices.forEach(slice => {
        const sliceAngleDeg = (slice.weight / totalWeight) * 360;
        if (slice.originalIndex === winnerOriginalIndex) {
            candidates.push(angleAccumulator + sliceAngleDeg / 2);
        }
        angleAccumulator += sliceAngleDeg;
    });
    if (candidates.length === 0) {
        finishSpin(null);
        return;
    }
    const targetCenterRelative = candidates[Math.floor(Math.random() * candidates.length)];
    const currentMod = currentAngle % 360;
    const goalMod = (360 - targetCenterRelative) % 360;
    let angleToGoal = goalMod - currentMod;
    if (angleToGoal <= 0) angleToGoal += 360;
    const totalRotation = angleToGoal + (360 * MIN_ROTATIONS);
    const startAngleForAnim = currentAngle;
    const finalAngle = startAngleForAnim + totalRotation;
    const startTime = performance.now();

    function decelerateLoop(time) {
        try {
            const elapsed = time - startTime;
            if (elapsed < DECEL_DURATION) {
                let t = elapsed / DECEL_DURATION;
                const ease = (--t)*t*t+1; 
                currentAngle = startAngleForAnim + (totalRotation * ease);
                drawWheel();
                animationFrameId = requestAnimationFrame(decelerateLoop);
            } else {
                currentAngle = finalAngle;
                drawWheel();
                finishSpin(items[winnerOriginalIndex]);
            }
        } catch (e) {
            console.error(e);
            finishSpin(items[winnerOriginalIndex]);
        }
    }
    animationFrameId = requestAnimationFrame(decelerateLoop);
}

function finishSpin(winnerItem) {
    isSpinning = false;
    stopDrum();
    document.getElementById('spinBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    if (winnerItem) {
        playFanfare();
        setTimeout(() => { showResult(winnerItem); }, 500);
    }
}

function showResult(item) {
    const msg = item.message || "おめでとう！";
    document.getElementById('resultTitle').innerText = msg;
    document.getElementById('resultText').innerText = item.name;
    document.getElementById('resultModal').style.display = "block";
}

function closeModal() {
    document.getElementById('resultModal').style.display = "none";
}
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) { color += letters[Math.floor(Math.random() * 16)]; }
    return color;
}

function loadSettings() {
    const saved = localStorage.getItem('gachaSettings');
    items = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultItems));
    items.forEach(item => {
        if (!item.split_count) item.split_count = 1;
        if (!item.message) item.message = "おめでとう！";
        if (item.real_weight === undefined) item.real_weight = item.visual_weight;
    });
    generateDisplaySlices();
    renderSettingsUI();
    drawWheel();
}

function saveSettings() {
    localStorage.setItem('gachaSettings', JSON.stringify(items));
}

function renderSettingsUI() {
    const header = document.getElementById('settingsHeader');
    let headerHtml = `<span>色</span><span>名前(金額)</span><span>見た目</span>`;
    if (isSecretMode) {
        headerHtml += `<span>裏確率</span>`;
        header.className = 'settings-grid-header mode-secret';
    } else {
        header.className = 'settings-grid-header mode-normal';
    }
    headerHtml += `<span>分割</span><span>メッセージ</span><span>削除</span>`;
    header.innerHTML = headerHtml;

    const list = document.getElementById('itemsList');
    list.innerHTML = '';
    items.forEach((item, index) => { addSettingRow(item, index); });
}

function addSettingRow(item = null, index = null) {
    const list = document.getElementById('itemsList');
    const li = document.createElement('li');
    li.className = isSecretMode ? 'input-group mode-secret' : 'input-group mode-normal';
    
    const nameVal = item ? item.name : '';
    const vWeight = item ? item.visual_weight : 1;
    const rWeight = item ? item.real_weight : 1;
    const sCount = item ? item.split_count : 1;
    const msg = item ? item.message : "おめでとう！";
    const color = item ? item.color : getRandomColor();

    // 入力欄にplaceholderを追加して、スマホでのカード表示時にわかりやすくします
    let html = `
        <input type="color" name="color" value="${color}">
        <input type="text" name="itemName" value="${nameVal}" placeholder="項目名">
        <input type="number" name="visualWeight" value="${vWeight}" min="1" placeholder="見た目">
    `;

    if (isSecretMode) {
        html += `<input type="number" name="realWeight" value="${rWeight}" min="1" style="background:#ffebee;" placeholder="裏確率">`;
    } else {
        html += `<input type="hidden" name="realWeight" value="${rWeight}">`;
    }

    html += `
        <input type="number" name="splitCount" value="${sCount}" min="1" placeholder="分割数">
        <input type="text" name="message" value="${msg}" placeholder="当選メッセージ">
        <button onclick="this.parentElement.remove()" class="btn-small btn-reset" style="margin:0; padding:5px;">この項目を削除</button>
    `;

    li.innerHTML = html;
    list.appendChild(li);
}

function saveSettingsFromUI() {
    const list = document.getElementById('itemsList');
    const rows = list.querySelectorAll('li');
    const newItems = [];
    
    rows.forEach(row => {
        newItems.push({
            name: row.querySelector('input[name="itemName"]').value,
            color: row.querySelector('input[name="color"]').value,
            visual_weight: parseFloat(row.querySelector('input[name="visualWeight"]').value) || 1,
            real_weight: parseFloat(row.querySelector('input[name="realWeight"]').value) || 1,
            split_count: parseInt(row.querySelector('input[name="splitCount"]').value) || 1,
            message: row.querySelector('input[name="message"]').value
        });
    });

    if (newItems.length === 0) { alert("項目を1つ以上設定してください"); return; }
    items = newItems;
    saveSettings();
    generateDisplaySlices();
    drawWheel();
    alert("設定を保存しました");
}

function initAudio() { if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume(); } }
async function loadAudioFiles() {
    try {
        const drumRes = await fetch('/static/sounds/drum.mp3');
        const fanfareRes = await fetch('/static/sounds/fanfare.mp3');
        if(drumRes.ok) drumBuffer = await drumRes.arrayBuffer().then(b => audioCtx.decodeAudioData(b));
        if(fanfareRes.ok) fanfareBuffer = await fanfareRes.arrayBuffer().then(b => audioCtx.decodeAudioData(b));
    } catch(e) { console.log(e); }
}
function playDrum() {
    if (!audioCtx || !drumBuffer) return;
    stopDrum();
    drumSource = audioCtx.createBufferSource();
    drumSource.buffer = drumBuffer;
    drumSource.loop = true;
    drumSource.connect(audioCtx.destination);
    drumSource.start(0);
}
function stopDrum() { if (drumSource) { try { drumSource.stop(); } catch(e) {} drumSource = null; } }
function playFanfare() {
    if (!audioCtx || !fanfareBuffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = fanfareBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
}