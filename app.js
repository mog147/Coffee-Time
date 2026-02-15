// === Navigation ===
function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
    if (page === 'news') fetchNews();
    if (page === 'log') renderLogPage();
    if (page === 'home') renderHome();
}

// === Greeting ===
function updateGreeting() {
    const h = new Date().getHours();
    let msg = 'おはようございます';
    if (h >= 12 && h < 18) msg = 'こんにちは';
    if (h >= 18) msg = 'こんばんは';
    const el = document.getElementById('greeting');
    if (el) el.textContent = msg + ' ☕';
}

// === Timer ===
let timerInterval = null;
let timerSeconds = 0;
let timerTotal = 0;
let timerRunning = false;
let timerMethod = '';

function formatTime(sec) {
    if (sec >= 3600) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    document.getElementById('timer-display').textContent = formatTime(timerSeconds);
}

function selectMethod(name, seconds) {
    timerMethod = name;
    timerTotal = seconds;
    timerSeconds = seconds;
    timerRunning = false;
    clearInterval(timerInterval);
    updateTimerDisplay();
    document.getElementById('timer-label').textContent = name;
    document.getElementById('toggle-icon').textContent = 'play_arrow';
    document.getElementById('btn-toggle').disabled = false;
    document.getElementById('btn-reset').disabled = false;
    document.getElementById('btn-stop').disabled = false;
    document.querySelectorAll('.method-item').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

function toggleTimer() {
    if (!timerTotal) return;
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('toggle-icon').textContent = 'play_arrow';
    } else {
        timerRunning = true;
        document.getElementById('toggle-icon').textContent = 'pause';
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                document.getElementById('toggle-icon').textContent = 'play_arrow';
                document.getElementById('timer-label').textContent = '完了！';
                if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = timerTotal;
    updateTimerDisplay();
    document.getElementById('toggle-icon').textContent = 'play_arrow';
    document.getElementById('timer-label').textContent = timerMethod;
}

function stopTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 0;
    timerTotal = 0;
    timerMethod = '';
    updateTimerDisplay();
    document.getElementById('toggle-icon').textContent = 'play_arrow';
    document.getElementById('timer-label').textContent = 'タイマーを選択';
    document.getElementById('btn-toggle').disabled = true;
    document.getElementById('btn-reset').disabled = true;
    document.getElementById('btn-stop').disabled = true;
    document.querySelectorAll('.method-item').forEach(el => el.classList.remove('selected'));
}

function startQuickTimer(seconds) {
    navigate('timer');
    const names = { 240: 'ハンドドリップ', 30: 'エスプレッソ' };
    timerMethod = names[seconds] || 'タイマー';
    timerTotal = seconds;
    timerSeconds = seconds;
    timerRunning = false;
    clearInterval(timerInterval);
    updateTimerDisplay();
    document.getElementById('timer-label').textContent = timerMethod;
    document.getElementById('btn-toggle').disabled = false;
    document.getElementById('btn-reset').disabled = false;
    document.getElementById('btn-stop').disabled = false;
    toggleTimer();
}

// === News ===
let newsLoaded = false;

async function fetchNews() {
    if (newsLoaded) return;
    const container = document.getElementById('news-container');
    const rssUrl = 'https://dailycoffeenews.com/feed/';
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&t=${Date.now()}`;

    try {
        const res = await fetch(proxyUrl);
        const data = await res.json();
        if (data.status === 'ok') {
            container.innerHTML = '';
            data.items.slice(0, 8).forEach((item, i) => {
                const desc = item.description.replace(/<[^>]*>/g, '').substring(0, 120);
                const date = new Date(item.pubDate).toLocaleDateString('ja-JP');
                const card = document.createElement('div');
                card.className = 'news-card';
                card.dataset.title = item.title;
                card.dataset.desc = desc;
                card.innerHTML = `
                    <h4>${item.title}</h4>
                    <p>${desc}...</p>
                    <div class="news-meta">
                        <span>${date}</span>
                        <div style="display:flex;gap:6px">
                            <button class="btn-translate" onclick="translateFromCard(this)">和訳</button>
                            <a href="${item.link}" target="_blank" rel="noopener" class="btn-translate" style="text-decoration:none;text-align:center">元記事</a>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
            newsLoaded = true;
        } else throw new Error();
    } catch {
        container.innerHTML = '<div class="empty-state"><p>ニュースの取得に失敗しました</p></div>';
    }
}

async function translateFromCard(btn) {
    const card = btn.closest('.news-card');
    const title = card.dataset.title;
    const desc = card.dataset.desc;
    btn.textContent = '翻訳中...';
    btn.disabled = true;
    try {
        const tr = async t => {
            const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=en|ja`);
            const j = await r.json();
            return j.responseData.translatedText;
        };
        const [tt, td] = await Promise.all([tr(title), tr(desc)]);
        card.querySelector('h4').textContent = tt;
        card.querySelector('p').textContent = td;
        btn.textContent = '完了';
    } catch {
        btn.textContent = 'エラー';
        setTimeout(() => { btn.textContent = '和訳'; btn.disabled = false }, 2000);
    }
}

// === Coffee Log (localStorage) ===
const STORAGE_KEY = 'coffee-log';

function getLogs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch { return [] }
}

function saveLogs(logs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

let currentRating = 3;

function setRating(n) {
    currentRating = n;
    document.querySelectorAll('#rating .star').forEach((s, i) => {
        s.classList.toggle('active', i < n);
    });
}

function openLogModal() {
    document.getElementById('log-overlay').style.display = 'block';
    document.getElementById('log-modal').style.display = 'block';
    setRating(3);
    document.getElementById('log-beans').value = '';
    document.getElementById('log-method').selectedIndex = 0;
}

function closeLogModal() {
    document.getElementById('log-overlay').style.display = 'none';
    document.getElementById('log-modal').style.display = 'none';
}

function saveLogEntry() {
    const method = document.getElementById('log-method').value;
    const beans = document.getElementById('log-beans').value.trim();
    const rating = currentRating;
    const now = new Date();

    const entry = {
        id: Date.now(),
        method,
        beans,
        rating,
        date: now.toISOString()
    };

    const logs = getLogs();
    logs.unshift(entry);
    saveLogs(logs);
    closeLogModal();
    renderHome();
}

function getMethodIcon(method) {
    const map = {
        'ハンドドリップ': 'coffee',
        'エスプレッソ': 'local_cafe',
        'フレンチプレス': 'water_drop',
        'エアロプレス': 'filter_alt',
        '水出し': 'ac_unit',
        'カフェで購入': 'storefront'
    };
    return map[method] || 'coffee';
}

function renderHome() {
    updateGreeting();
    const logs = getLogs();
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.date).toDateString() === today);
    const container = document.getElementById('today-log');

    if (todayLogs.length === 0) {
        container.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:12px 0">まだ今日のコーヒーはありません</div>';
    } else {
        container.innerHTML = todayLogs.map(l => `
            <div class="today-entry">
                <span class="mi">${getMethodIcon(l.method)}</span>
                <span>${l.method}${l.beans ? ' · ' + l.beans : ''}</span>
                <span class="stars">${'★'.repeat(l.rating)}</span>
            </div>
        `).join('');
    }
}

function renderLogPage() {
    const logs = getLogs();
    const list = document.getElementById('log-list');
    const empty = document.getElementById('log-empty');
    const summary = document.getElementById('log-summary');

    if (logs.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        summary.innerHTML = '';
        return;
    }

    empty.style.display = 'none';

    // Summary
    const thisMonth = logs.filter(l => {
        const d = new Date(l.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const avgRating = thisMonth.length > 0
        ? (thisMonth.reduce((s, l) => s + l.rating, 0) / thisMonth.length).toFixed(1)
        : '-';

    summary.innerHTML = `
        <div class="summary-card">
            <div class="summary-num">${thisMonth.length}</div>
            <div class="summary-label">今月の杯数</div>
        </div>
        <div class="summary-card">
            <div class="summary-num">${avgRating}</div>
            <div class="summary-label">平均評価</div>
        </div>
    `;

    // List
    list.innerHTML = logs.slice(0, 50).map(l => {
        const d = new Date(l.date);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `
            <div class="log-entry">
                <div class="log-icon"><span class="mi">${getMethodIcon(l.method)}</span></div>
                <div class="log-body">
                    <div class="log-title">${l.method}</div>
                    ${l.beans ? `<div class="log-detail">${l.beans}</div>` : ''}
                    <div class="log-stars">${'★'.repeat(l.rating)}${'☆'.repeat(5 - l.rating)}</div>
                </div>
                <div class="log-date">${dateStr}</div>
            </div>
        `;
    }).join('');
}

// === Init ===
renderHome();
