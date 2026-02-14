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
    milkLayer.style.height = `100%`;
};

ratioSlider.addEventListener('input', updateLatte);

// Blend Builder Logic
const beanContainer = document.getElementById('bean-container');

function addBeanRow() {
    const row = document.createElement('div');
    row.className = 'bean-row';
    row.style.marginTop = '1rem';
    row.innerHTML = `
        <input type="text" placeholder="Origin" class="bean-name" style="border-bottom: 1px solid #eee; padding: 0.5rem 0; width: 220px; background: transparent; border-top:none; border-left:none; border-right:none; color: var(--text-main); margin-right: 1rem;">
        <input type="number" placeholder="%" class="bean-pct" style="border-bottom: 1px solid #eee; padding: 0.5rem 0; width: 50px; background: transparent; border-top:none; border-left:none; border-right:none; color: var(--text-main);">
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
        border-bottom: 1px solid rgba(0,0,0,0.05);
        padding: 2rem 0;
        margin-bottom: 1rem;
        animation: fadeInUp 1s ease;
    `;

    logCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">
            <span>${dateStr} ${timeStr}</span>
            <span>Ratio ${ratio}%</span>
        </div>
        <p style="font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--text-main);">${blendSummary.length > 0 ? blendSummary.join(' / ') : 'A moment of silence'}</p>
    `;

    if (logsContainer.querySelector('p')) {
        logsContainer.innerHTML = '';
    }

    logsContainer.prepend(logCard);

    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Archived';
    btn.style.opacity = '0.5';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.opacity = '1';
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
