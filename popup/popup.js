document.addEventListener('DOMContentLoaded', updateUI);
document.getElementById('settings-btn').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options/options.html'));
    }
});

async function updateUI() {
    const data = await chrome.storage.local.get(['stats', 'limits']);
    const today = new Date().toDateString();
    const stats = data.stats?.[today] || {};
    const limits = data.limits || {};

    // Calculate total
    let totalSeconds = 0;
    const sites = [];

    for (const [domain, seconds] of Object.entries(stats)) {
        totalSeconds += seconds;
        sites.push({ domain, seconds });
    }

    // Sort by time desc
    sites.sort((a, b) => b.seconds - a.seconds);

    // Update Total Time
    document.getElementById('total-time').textContent = formatTime(totalSeconds);

    // Update List
    const listEl = document.getElementById('top-sites-list');
    listEl.innerHTML = '';

    if (sites.length === 0) {
        listEl.innerHTML = '<li style="text-align:center; color: var(--text-secondary); padding: 10px;">Sin actividad hoy</li>';
    } else {
        sites.slice(0, 5).forEach(site => { // Show top 5
            const li = document.createElement('li');
            li.className = 'site-item';
            li.innerHTML = `
        <span class="site-name">${site.domain}</span>
        <span class="site-time">${formatTime(site.seconds)}</span>
      `;
            listEl.appendChild(li);
        });
    }

    // Suggestions (Find top 3 sites > 30 mins that isn't limited)
    // Threshold: 30 mins = 1800 seconds
    const candidates = sites.filter(s => s.seconds > 1800 && !limits[s.domain]);
    const top3Suggestions = candidates.slice(0, 3);

    const suggestionBox = document.getElementById('suggestion-box');
    const suggestionList = document.getElementById('suggestion-list');
    suggestionList.innerHTML = '';

    if (top3Suggestions.length > 0) {
        suggestionBox.classList.remove('hidden');
        top3Suggestions.forEach(site => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
        <span>${site.domain}</span>
        <button class="suggestion-btn">Limitar (1h)</button>
      `;
            div.querySelector('button').onclick = () => {
                limits[site.domain] = 3600;
                chrome.storage.local.set({ limits }, () => {
                    updateUI(); // Refresh to remove this item
                });
            };
            suggestionList.appendChild(div);
        });
    } else {
        suggestionBox.classList.add('hidden');
    }
}

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}
