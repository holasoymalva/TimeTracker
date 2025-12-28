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
    const rawInput = document.getElementById('domain-input').value;
    const domain = normalizeDomain(rawInput);

    const type = document.getElementById('type-select').value;
    const time = document.getElementById('time-input').value;

    if (!domain) return;

    if (type === 'block') {
        const data = await chrome.storage.local.get(['blocked']);
        const blocked = data.blocked || [];
        // Check if checks already exist considering normalization
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

function normalizeDomain(input) {
    let domain = input.trim().toLowerCase();

    // Try to parse as URL if protocol is present
    if (domain.includes('://') || domain.startsWith('http')) {
        try {
            const url = new URL(domain);
            domain = url.hostname;
        } catch (e) {
            // If parsing fails, try primitive cleanup
            domain = domain.split('/')[2] || domain;
        }
    } else {
        // User typed "facebook.com" or "facebook.com/page"
        domain = domain.split('/')[0];
    }

    // Remove www. prefix for consistency
    if (domain.startsWith('www.')) {
        domain = domain.slice(4);
    }

    return domain;
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
    const legend = document.getElementById('stats-legend');
    const canvas = document.getElementById('stats-chart');

    // Clear existing
    list.innerHTML = '';
    legend.innerHTML = '';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Prepare Data
    const entries = Object.entries(stats).sort(([, a], [, b]) => b - a);
    const totalSeconds = entries.reduce((acc, [, s]) => acc + s, 0);

    if (totalSeconds === 0) {
        ctx.fillStyle = '#565f89';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos hoy', canvas.width / 2, canvas.height / 2);
        return;
    }

    const palette = [
        '#7aa2f7', '#bb9af7', '#7dcfff', '#9ece6a', '#e0af68', '#f7768e', '#c0caf5', '#565f89', '#414868', '#24283b'
    ];

    let startAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    entries.forEach(([domain, seconds], index) => {
        // 1. Draw Pie Slice
        const sliceAngle = (seconds / totalSeconds) * 2 * Math.PI;
        const color = palette[index % palette.length];

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#1a1b26';
        ctx.lineWidth = 2;
        ctx.stroke();

        startAngle += sliceAngle;

        // 2. Add to Legend
        const percentage = ((seconds / totalSeconds) * 100).toFixed(1);
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `
      <div class="color-dot" style="background-color: ${color}"></div>
      <div class="legend-text">
        <span>${domain}</span>
        <span class="legend-percent">${percentage}%</span>
      </div>
    `;
        legend.appendChild(div);

        // 3. Add to detailed list
        const li = document.createElement('li');
        li.style.marginBottom = '8px';
        li.innerHTML = `${domain}: <strong>${(seconds / 60).toFixed(1)} min</strong>`;
        list.appendChild(li);
    });

    // Cutout center for Donut Chart look (optional, looks modern)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#24283b'; // Matches card bg
    ctx.fill();
}
