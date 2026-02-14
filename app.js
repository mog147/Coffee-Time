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

// Bean functions removed as per request
// History Logic
const logsContainer = document.getElementById('logs-container');

function saveLog() {
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
        <p style="font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--text-main);">Stay balanced in this moment.</p>
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
            data.items.slice(0, 5).forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'news-card';
                card.id = `news-${index}`;
                card.innerHTML = `
                    <h4>${item.title}</h4>
                    <p class="news-desc" style="font-size: 0.85rem; margin-bottom: 1rem; color: var(--text-main);">${item.description.replace(/<[^>]*>?/gm, '').substring(0, 150)}...</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <small>${new Date(item.pubDate).toLocaleDateString('ja-JP')}</small>
                        <button class="secondary-btn" style="padding: 0.3rem 1rem; font-size: 0.7rem;" onclick="translateNews(this, \`${item.title}\`, \`${item.description.replace(/<[^>]*>?/gm, '').substring(0, 150)}\`)">和訳する</button>
                    </div>
                `;
                newsContainer.appendChild(card);
            });
        } else {
            throw new Error('News fetch failed');
        }
    } catch (error) {
        newsContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center;">便りの取得に失敗いたしました。</p>`;
    }
}

async function translateNews(btn, title, desc) {
    const card = btn.closest('.news-card');
    const titleEl = card.querySelector('h4');
    const descEl = card.querySelector('.news-desc');

    btn.textContent = '翻訳中...';
    btn.disabled = true;

    try {
        const translate = async (text) => {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ja`);
            const json = await res.json();
            return json.responseData.translatedText;
        };

        const [translatedTitle, translatedDesc] = await Promise.all([
            translate(title),
            translate(desc)
        ]);

        titleEl.textContent = translatedTitle;
        descEl.textContent = translatedDesc;
        btn.textContent = '翻訳完了';
    } catch (error) {
        btn.textContent = 'エラー';
        setTimeout(() => {
            btn.textContent = '和訳する';
            btn.disabled = false;
        }, 2000);
    }
}
