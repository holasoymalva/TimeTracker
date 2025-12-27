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
    return u.hostname;
  } catch (e) {
    return null;
  }
}

async function updateTime() {
  const now = Date.now();
  const domain = getDomain(currentUrl);
  
  if (domain && isBrowserFocused && currentTabId !== null) {
    const elapsed = (now - startTime) / 1000; // seconds
    if (elapsed > 0) {
      const data = await chrome.storage.local.get(['stats']);
      const stats = data.stats || {};
      const today = new Date().toDateString();
      
      if (!stats[today]) stats[today] = {};
      if (!stats[today][domain]) stats[today][domain] = 0;
      
      stats[today][domain] += elapsed;
      await chrome.storage.local.set({ stats });
      
      checkLimits(domain, stats[today][domain]);
    }
  }
  startTime = now;
}

async function checkLimits(domain, timeSpent) {
  const data = await chrome.storage.local.get(['limits', 'blocked']);
  const limits = data.limits || {};
  const blocked = data.blocked || [];
  
  // Check if manually blocked
  if (blocked.includes(domain)) {
    blockTab(currentTabId);
    return;
  }

  // Check time limit
  if (limits[domain] && timeSpent > limits[domain]) {
    blockTab(currentTabId);
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
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (tabs.length > 0) {
      currentTabId = tabs[0].id;
      currentUrl = tabs[0].url;
    }
    startTime = Date.now();
  }
});

// Periodic update to catch "sitting on a page"
chrome.alarms.create("timeTracker", { periodInMinutes: 1/6 }); // Every 10 seconds
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "timeTracker") {
    updateTime();
  }
});
