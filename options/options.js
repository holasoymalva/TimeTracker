document.addEventListener('DOMContentLoaded', () => {
    loadRules();
    setupTabs();

    document.getElementById('add-rule-btn').addEventListener('click', addRule);
    document.getElementById('type-select').addEventListener('change', (e) => {
        const timeInput = document.getElementById('time-input');
        if (e.target.value === 'block') {
            timeInput.style.display = 'none';
        } else {
            timeInput.style.display = 'block';
        }
    });
});

function setupTabs() {
    const tabs = document.querySelectorAll('.nav-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');

            if (tab.dataset.tab === 'stats') loadStats();
        });
    });
}

async function loadRules() {
    const data = await chrome.storage.local.get(['limits', 'blocked']);
    const limits = data.limits || {};
    const blocked = data.blocked || [];
    const container = document.getElementById('rules-list');

    container.innerHTML = '';

    // Render Limits
    for (const [domain, seconds] of Object.entries(limits)) {
        const mins = Math.floor(seconds / 60);
        renderRuleItem(container, domain, `Límite: ${mins} min/día`, () => removeLimit(domain));
    }

    // Render Blocks
    blocked.forEach(domain => {
        renderRuleItem(container, domain, 'Bloqueado permanentemente', () => removeBlock(domain));
    });
}

function renderRuleItem(container, domain, subtext, onDelete) {
    const div = document.createElement('div');
    div.className = 'rule-item';
    div.innerHTML = `
    <div class="rule-info">
      <span class="rule-domain">${domain}</span>
      <span class="rule-limit">${subtext}</span>
    </div>
  `;

    const btn = document.createElement('button');
    btn.className = 'delete-btn';
    btn.textContent = 'Eliminar';
    btn.onclick = onDelete;

    div.appendChild(btn);
    container.appendChild(div);
}

async function addRule() {
    const domain = document.getElementById('domain-input').value.trim();
    const type = document.getElementById('type-select').value;
    const time = document.getElementById('time-input').value;

    if (!domain) return;

    if (type === 'block') {
        const data = await chrome.storage.local.get(['blocked']);
        const blocked = data.blocked || [];
        if (!blocked.includes(domain)) {
            blocked.push(domain);
            await chrome.storage.local.set({ blocked });
        }
    } else {
        // Limit
        if (!time || time <= 0) return;
        const data = await chrome.storage.local.get(['limits']);
        const limits = data.limits || {};
        limits[domain] = parseInt(time) * 60; // store in seconds
        await chrome.storage.local.set({ limits });
    }

    document.getElementById('domain-input').value = '';
    document.getElementById('time-input').value = '';
    loadRules();
}

async function removeLimit(domain) {
    const data = await chrome.storage.local.get(['limits']);
    const limits = data.limits || {};
    delete limits[domain];
    await chrome.storage.local.set({ limits });
    loadRules();
}

async function removeBlock(domain) {
    const data = await chrome.storage.local.get(['blocked']);
    const blocked = data.blocked || [];
    const newBlocked = blocked.filter(d => d !== domain);
    await chrome.storage.local.set({ blocked: newBlocked });
    loadRules();
}

async function loadStats() {
    const data = await chrome.storage.local.get(['stats']);
    const today = new Date().toDateString();
    const stats = data.stats?.[today] || {};
    const list = document.getElementById('full-stats-list');
    list.innerHTML = '';

    Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .forEach(([domain, seconds]) => {
            const li = document.createElement('li');
            li.style.marginBottom = '8px';
            li.textContent = `${domain}: ${(seconds / 60).toFixed(1)} min`;
            list.appendChild(li);
        });
}
