// Latte Visualizer Logic
const ratioSlider = document.getElementById('ratio-slider');
const ratioVal = document.getElementById('ratio-val');
const espressoLayer = document.getElementById('espresso-layer');
const milkLayer = document.getElementById('milk-layer');
const espressoMl = document.getElementById('espresso-ml');
const milkMl = document.getElementById('milk-ml');

const updateLatte = () => {
    const ratio = parseInt(ratioSlider.value);
    ratioVal.textContent = ratio;

    // Total cup height is represented as 100% in visualizer
    // Espresso is the bottom layer, Milk sits on top
    espressoLayer.style.height = `${ratio}%`;
    milkLayer.style.height = `100%`; // Milk fills the whole thing, espresso overlaps via z-index or absolute positioning logic
    // Actually, in CSS, espresso is on bottom. Let's make milk-layer height = 100% - foam (simulated) or just keep it simple.
    // Let's adjust: Espresso at bottom, Milk level is 100%.

    // For realism, let's say total is 240ml
    const totalMl = 240;
    const eMl = Math.round(totalMl * (ratio / 100));
    const mMl = totalMl - eMl;

    espressoMl.textContent = `${eMl}ml`;
    milkMl.textContent = `${mMl}ml`;
};

ratioSlider.addEventListener('input', updateLatte);

// Blend Builder Logic
const beanContainer = document.getElementById('bean-container');

function addBeanRow() {
    const row = document.createElement('div');
    row.className = 'bean-row';
    row.innerHTML = `
        <input type="text" placeholder="豆の名前" class="bean-name">
        <input type="number" placeholder="%" class="bean-pct">
        <span>%</span>
    `;
    beanContainer.appendChild(row);
}

// History Logic
const logsContainer = document.getElementById('logs-container');

function saveLog() {
    const beans = document.querySelectorAll('.bean-row');
    let blendSummary = [];
    beans.forEach(row => {
        const name = row.querySelector('.bean-name').value;
        const pct = row.querySelector('.bean-pct').value;
        if (name && pct) blendSummary.push(`${name} (${pct}%)`);
    });

    const ratio = ratioSlider.value;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('ja-JP');

    const logCard = document.createElement('div');
    logCard.style.cssText = `
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 1.5rem;
        border-radius: 15px;
        margin-bottom: 1rem;
        animation: fadeInUp 0.5s ease;
    `;

    logCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <strong style="color: var(--primary);">${dateStr} ${timeStr}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Cafe Latte (${ratio}%)</span>
        </div>
        <p style="font-size: 0.9rem;">${blendSummary.length > 0 ? blendSummary.join(' / ') : 'コーヒー豆の記録なし'}</p>
    `;

    if (logsContainer.querySelector('p')) {
        logsContainer.innerHTML = '';
    }

    logsContainer.prepend(logCard);

    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '保存いたしました';
    btn.style.background = '#4CAF50';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

// Initial Call
updateLatte();

// Section Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    // Show target section
    const target = document.getElementById(`${sectionId}-section`);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 10);
        target.scrollIntoView({ behavior: 'smooth' });
    }

    if (sectionId === 'news') {
        fetchCoffeeNews();
    }
}

// Coffee News Fetcher (using a CORS proxy for RSS feeds)
async function fetchCoffeeNews() {
    const newsContainer = document.getElementById('news-container');
    const rssUrl = 'https://dailycoffeenews.com/feed/';
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.status === 'ok') {
            newsContainer.innerHTML = '';
            data.items.slice(0, 5).forEach(item => {
                const card = document.createElement('div');
                card.className = 'news-card';
                card.innerHTML = `
                    <h4><a href="${item.link}" target="_blank" style="color: inherit; text-decoration: none;">${item.title}</a></h4>
                    <p style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-main);">${item.description.replace(/<[^>]*>?/gm, '').substring(0, 150)}...</p>
                    <small>${new Date(item.pubDate).toLocaleDateString('ja-JP')} | Daily Coffee News</small>
                `;
                newsContainer.appendChild(card);
            });
        } else {
            throw new Error('News fetch failed');
        }
    } catch (error) {
        newsContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center;">便りの取得に失敗いたしました。後ほどお試しくださいませ。</p>`;
    }
}
