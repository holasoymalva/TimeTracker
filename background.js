// background.js

let currentTabId = null;
let currentUrl = null;
let startTime = Date.now();
let isBrowserFocused = true;

// Initialize storage structure if needed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['stats', 'limits', 'blocked', 'settings'], (data) => {
    if (!data.stats) chrome.storage.local.set({ stats: {} });
    if (!data.limits) chrome.storage.local.set({ limits: {} }); // { "domain": seconds }
    if (!data.blocked) chrome.storage.local.set({ blocked: [] });
    if (!data.settings) chrome.storage.local.set({ settings: { defaultLimit: 3600 } }); // Default global limit? optional
  });
});

function getDomain(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    let hostname = u.hostname;
    // Normalize: remove www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch (e) {
    return null;
  }
}

async function updateTime() {
  const now = Date.now();
  const domain = getDomain(currentUrl);

  if (domain && isBrowserFocused && currentTabId !== null) {
    const elapsed = (now - startTime) / 1000;
    if (elapsed > 0) {
      const data = await chrome.storage.local.get(['stats']);
      const stats = data.stats || {};
      const today = new Date().toDateString();

      if (!stats[today]) stats[today] = {};
      if (!stats[today][domain]) stats[today][domain] = 0;

      stats[today][domain] += elapsed;
      await chrome.storage.local.set({ stats });

      // Pass both specific and total time for checks
      checkLimits(domain, stats[today][domain]);
    }
  }
  startTime = now;
}

// Helper to check substring matches
function isDomainMatch(target, rule) {
  // Rule: facebook.com matches facebook.com, m.facebook.com
  // Rule: google.com matches google.com
  if (target === rule) return true;
  if (target.endsWith('.' + rule)) return true;
  return false;
}

async function checkLimits(domain, timeSpent = 0) {
  if (!domain) return;

  const data = await chrome.storage.local.get(['limits', 'blocked']);
  const limits = data.limits || {};
  const blocked = data.blocked || [];

  // 1. Check Blocked List (Pattern Match)
  const isBlocked = blocked.some(rule => isDomainMatch(domain, rule));
  if (isBlocked) {
    blockTab(currentTabId);
    return;
  }

  // 2. Check Time Limits (Pattern Match)
  // We need to find the matching rule if any
  for (const [rule, limit] of Object.entries(limits)) {
    if (isDomainMatch(domain, rule)) {
      if (timeSpent > limit) {
        blockTab(currentTabId);
        return;
      }
    }
  }
}

function blockTab(tabId) {
  chrome.tabs.update(tabId, { url: chrome.runtime.getURL("options/blocked.html") });
}

// Listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateTime();
  currentTabId = activeInfo.tabId;
  const tab = await chrome.tabs.get(currentTabId);
  currentUrl = tab.url;
  startTime = Date.now();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const domain = getDomain(changeInfo.url);
    if (domain) {
      await checkLimits(domain, 0); // Check immediate blocks (time=0 effectively checks blocklist)
    }
  }

  if (tabId === currentTabId && changeInfo.url) {
    await updateTime();
    currentUrl = changeInfo.url;
    startTime = Date.now();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await updateTime();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    isBrowserFocused = false;
  } else {
    isBrowserFocused = true;
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      currentTabId = tabs[0].id;
      currentUrl = tabs[0].url;
    }
    startTime = Date.now();
  }
});

// Periodic update to catch "sitting on a page"
chrome.alarms.create("timeTracker", { periodInMinutes: 1 / 6 }); // Every 10 seconds
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "timeTracker") {
    updateTime();
  }
});
