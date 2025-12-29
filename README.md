<div align="center">
  <img src="icons/icon128.png" alt="FocusFlow Logo" width="128" height="128" />

  # FocusFlow - Time Tracker & Blocker
  
  **Reclaim Your Attention in the Digital Age.**
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/platform-Chrome-green.svg)](https://www.google.com/chrome/)
  [![Version](https://img.shields.io/badge/version-1.0.0-purple.svg)](https://github.com/holasoymalva/TimeTracker/releases)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/holasoymalva/TimeTracker/pulls)

  <p align="center">
    <a href="#key-features">Key Features</a> •
    <a href="#how-it-works">How It Works</a> •
    <a href="#installation">Installation</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#roadmap">Roadmap</a>
  </p>
</div>

---

## 🚀 Overview

**FocusFlow** is not just a time tracker; it's an intelligent companion for your browser designed to combat the attention economy. Built for high-performers, developers, and deep workers, FocusFlow autonomously monitors your digital footprint, identifies attention leaks, and empowers you to set granular boundaries on your browsing habits.

In a world where every pixel is engineered to distract you, FocusFlow gives you the control back.

## ✨ Key Features

### 📊 Precision Time Tracking
Real-time, second-by-second analytics of your browsing history. Our lightweight background worker ensures zero performance overhead while capturing every moment.

### 🧠 Intelligent Insights & Suggestions
The **Smart Audit** engine analyzes your behavior patterns and proactively identifies the "Top Distractions" — sites that consume disproportionate amounts of your time — and suggests actionable limits.

### 🛡️ Granular Access Control
Define your boundaries. Set strict daily time caps for entertainment sites (e.g., 30 mins/day for social media) or blacklist them entirely during deep work sessions.

### ⛔ The "Flow State" Blocker
When a limit is reached, FocusFlow engages a hard interrupt, redirecting you to a mindful "Access Restricted" zone, effectively breaking the dopamine loop and nudging you back to productivity.

### 🎨 Premium User Experience
Crafted with a "Glassmorphism" aesthetic, dark mode support, and micro-interactions that feel native to a modern OS.

---

## 🛠️ Tech Stack

Built with a focus on performance, privacy, and modern web standards.

- **Core**: Chrome Extension Manifest V3
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 Variables, Flexbox/Grid, Glassmorphism
- **Storage**: Chrome Local Storage API
- **Architecture**: Event-driven Background Service Worker

---

## ⚡ Installation

### For Developers / Local Testing

1. **Clone the Repository**
   ```bash
   git clone https://github.com/holasoymalva/TimeTracker.git
   cd TimeTracker
   ```

2. **Load into Chrome**
   - Open Chrome and navigate to `chrome://extensions`.
   - Toggle **Developer Mode** in the top right corner.
   - Click **Load unpacked**.
   - Select the `TimeTracker` directory.

3. **Pin & Play**
   - Pin the FocusFlow icon to your browser bar.
   - Start browsing to generate data!

---

## 📸 Screencasts

| Dashboard | Manager | Blocked State |
|:---:|:---:|:---:|
| *Visualize your daily metrics at a glance.* | *Configure granularity for every domain.* | *Gentle nudges to get back on track.* |

---

## 🗺️ Roadmap

- [ ] **Sync Layer**: Cross-device synchronization via Firebase/Supabase.
- [ ] **Focus Modes**: Pomodoro timer integration.
- [ ] **Gamification**: Streaks and productivity scores.
- [ ] **Visualizations**: Weekly/Monthly graphs using Chart.js.

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's a bug fix, new feature, or UI polish, feel free to fork the repo and submit a PR. 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with 💙 by <a href="https://github.com/holasoymalva">Malva</a></sub>
</div>
