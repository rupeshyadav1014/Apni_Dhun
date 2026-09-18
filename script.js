const audio = document.getElementById("audio");
const searchInput = document.getElementById("searchInput");
const trackList = document.getElementById("trackList");
const playBtn = document.getElementById("playBtn");
const progress = document.getElementById("progress");
const volume = document.getElementById("volume");
const nowTitle = document.getElementById("nowTitle");
const nowArtist = document.getElementById("nowArtist");
const cover = document.getElementById("cover");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");
const resultsTitle = document.getElementById("resultsTitle");
const status = document.getElementById("status");
const emptyState = document.getElementById("emptyState");
const playerBar = document.querySelector(".player-bar");

// Audius API Configuration
const APP_NAME = "ApniDhunPlayer";
const API_BASE = "https://discoveryprovider.audius.co/v1";

// Curated Singers Database by Language (Including Bhojpuri)
const ARTIST_DIRECTORY = {
  "Bhojpuri": ["Pawan Singh", "Khesari Lal Yadav", "Manoj Tiwari", "Shilpi Raj", "Akshara Singh", "Arvind Akela Kallu"],
  "Hindi": ["Arijit Singh", "Shreya Ghoshal", "Jubin Nautiyal", "Neha Kakkar", "A.R. Rahman", "Sonu Nigam"],
  "Punjabi": ["Diljit Dosanjh", "Sidhu Moose Wala", "AP Dhillon", "Karan Aujla", "Guru Randhawa"],
  "English": ["Taylor Swift", "Ed Sheeran", "The Weeknd", "Drake", "Dua Lipa", "Justin Bieber"],
  "Telugu": ["Sid Sriram", "Shreya Ghoshal", "Devi Sri Prasad", "Armaan Malik", "Anirudh Ravichander"],
  "Tamil": ["Anirudh Ravichander", "A.R. Rahman", "Sid Sriram", "Vijay Antony", "Yuvan Shankar Raja"],
  "Kannada": ["Sanjith Hegde", "Sonu Nigam", "Vijay Prakash", "Armaan Malik"],
  "Bengali": ["Arijit Singh", "Anupam Roy", "Shreya Ghoshal", "Jeet Gannguli"],
  "Marathi": ["Ajay-Atul", "Swapnil Bandodkar", "Adarsh Shinde", "Arya Ambekar"]
};

// Application State
let currentLanguage = "Bhojpuri";
let selectedArtist = null;
let tracks = [];
let index = 0, shuffle = false, repeat = false;

// Initialize Structured UI Components
function initUI() {
  const content = document.querySelector(".content");
  if (!content || document.getElementById("flowContainer")) return;

  const flowContainer = document.createElement("div");
  flowContainer.id = "flowContainer";
  flowContainer.style.cssText = "margin-bottom: 24px; display: flex; flex-direction: column; gap: 16px;";

  flowContainer.innerHTML = `
    <!-- Language Selection Tabs -->
    <div style="background: var(--card, #1e1e24); padding: 12px 16px; border-radius: 16px; border: 1px solid var(--line, rgba(255,255,255,0.1));">
      <div style="font-size: 11px; text-transform: uppercase; tracking: 1px; color: var(--muted, #888); margin-bottom: 8px; font-weight: 700;">1. Select Language</div>
      <div id="langTabs" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;"></div>
    </div>

    <!-- Artist Cards Grid -->
    <div style="background: var(--card, #1e1e24); padding: 16px; border-radius: 16px; border: 1px solid var(--line, rgba(255,255,255,0.1));">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="font-size: 11px; text-transform: uppercase; tracking: 1px; color: var(--muted, #888); font-weight: 700;">2. Choose Singer / Artist</div>
        <span id="activeLangLabel" style="font-size: 12px; font-weight: 600; color: #ff0055;">Bhojpuri</span>
      </div>
      <div id="artistGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px;"></div>
    </div>
  `;

  content.insertBefore(flowContainer, content.firstChild);
  renderLanguageTabs();
  selectLanguage("Bhojpuri");
}

// Render Languages as Visual Chips
function renderLanguageTabs() {
  const container = document.getElementById("langTabs");
  if (!container) return;

  container.innerHTML = Object.keys(ARTIST_DIRECTORY).map(lang => `
    <button onclick="selectLanguage('${lang}')" class="lang-btn-${lang}" style="
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--line, rgba(255,255,255,0.15));
      background: ${lang === currentLanguage ? 'linear-gradient(135deg, #ff0055, #ff5000)' : 'var(--bg, #121214)'};
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    ">${lang}</button>
  `).join('');
}

// Language Switcher
window.selectLanguage = function(lang) {
  currentLanguage = lang;
  selectedArtist = null;
  
  renderLanguageTabs();

  const label = document.getElementById("activeLangLabel");
  if (label) label.textContent = `${lang} Artists`;

  renderArtists(ARTIST_DIRECTORY[lang] || []);
  
  resultsTitle.textContent = `Popular ${lang} Tracks`;
  fetchAudiusTracks(lang);
};

// Render Artist Cards Grid with Avatars
function renderArtists(artists) {
  const container = document.getElementById("artistGrid");
  if (!container) return;

  container.innerHTML = artists.map(artist => {
    const isSelected = artist === selectedArtist;
    const initial = artist.charAt(0);
    return `
      <div onclick="selectArtist('${artist}')" style="
        background: ${isSelected ? 'linear-gradient(145deg, rgba(255,0,85,0.2), rgba(255,80,0,0.1))' : 'rgba(255,255,255,0.03)'};
        border: 1px solid ${isSelected ? '#ff0055' : 'rgba(255,255,255,0.08)'};
        border-radius: 12px;
        padding: 12px 8px;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s, border 0.2s;
      " onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff0055, #7928ca);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
          font-weight: 700;
          font-size: 18px;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">${initial}</div>
        <div style="font-size: 12px; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${artist}</div>
      </div>
    `;
  }).join('');
}

// Artist Selector: Displays Artist Songs
window.selectArtist = function(artist) {
  selectedArtist = artist;
  renderArtists(ARTIST_DIRECTORY[currentLanguage] || []);
  resultsTitle.textContent = `${artist} — ${currentLanguage} Songs`;
  fetchAudiusSearch(`${artist} ${currentLanguage}`);
};

// Expand/Minimize Console Controls
const volumeWrap = document.querySelector(".volume-wrap");
if (volumeWrap && !document.getElementById("expandBtn")) {
  const expandBtn = document.createElement("button");
  expandBtn.id = "expandBtn";
  expandBtn.className = "expand-btn";
  expandBtn.innerHTML = "⤢";
  expandBtn.title = "Toggle Fullscreen Console";
  expandBtn.onclick = toggleConsole;
  volumeWrap.appendChild(expandBtn);
}

function toggleConsole() {
  if (!playerBar) return;
  const isExpanded = playerBar.classList.toggle("expanded");
  const expandBtn = document.getElementById("expandBtn");
  if (expandBtn) expandBtn.innerHTML = isExpanded ? "✕" : "⤢";
}

function fmt(s) {
  if (!Number.isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

// Track List Renderer
function render(list = tracks) {
  trackList.innerHTML = "";
  if (!list.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  list.forEach((t, i) => {
    const el = document.createElement("div");
    el.className = "track" + (i === index ? " active" : "");
    el.style.cssText = "display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 10px; margin-bottom: 6px; background: rgba(255,255,255,0.02); transition: background 0.2s;";
    
    el.innerHTML = `
      <div style="font-weight: 700; font-size: 12px; width: 24px; text-align: center; opacity: 0.6;">#${i + 1}</div>
      <div class="thumb" style="width: 40px; height: 40px; border-radius: 8px; overflow: hidden; background: #222; display: flex; align-items: center; justify-content: center;">
        ${t.art ? `<img src="${t.art}" alt="" style="width: 100%; height: 100%; object-fit: cover;">` : "♫"}
      </div>
      <div style="flex: 1; overflow: hidden;">
        <div class="track-title" style="font-size: 13px; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHtml(t.title)}</div>
        <div class="track-artist" style="font-size: 11px; opacity: 0.7; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHtml(t.artist || "Unknown artist")}</div>
      </div>
      <div class="track-meta" style="font-size: 11px; opacity: 0.6;">${t.duration || "Full"}</div>
      <button class="track-play" style="background: none; border: none; font-size: 14px; cursor: pointer; color: inherit;">${i === index && !audio.paused ? "❚❚" : "▶"}</button>
    `;
    el.querySelector(".track-play").onclick = () => load(i, true, true);
    el.onclick = (e) => {
      if (!e.target.closest("button")) load(i, true, true);
    };
    trackList.appendChild(el);
  });
}

function load(i, autoplay = false, openConsole = false) {
  if (!tracks[i]) return;
  index = i;
  const t = tracks[i];
  audio.src = t.url;
  nowTitle.textContent = t.title;
  nowArtist.textContent = t.artist || "Unknown artist";
  cover.innerHTML = t.art ? `<img src="${t.art}" alt="">` : "♫";
  render();
  
  if (autoplay) audio.play().catch(() => {});
  
  if (openConsole && playerBar && !playerBar.classList.contains("expanded")) {
    toggleConsole();
  }
}

function playPause() {
  if (!tracks.length) return;
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

playBtn.onclick = playPause;
document.getElementById("nextBtn").onclick = () => load(shuffle ? Math.floor(Math.random() * tracks.length) : (index + 1) % tracks.length, true, playerBar ? playerBar.classList.contains("expanded") : false);
document.getElementById("prevBtn").onclick = () => load((index - 1 + tracks.length) % tracks.length, true, playerBar ? playerBar.classList.contains("expanded") : false);

document.getElementById("shuffleBtn").onclick = () => {
  shuffle = !shuffle;
  document.getElementById("shuffleBtn").style.opacity = shuffle ? 1 : 0.5;
};
document.getElementById("repeatBtn").onclick = () => {
  repeat = !repeat;
  document.getElementById("repeatBtn").style.opacity = repeat ? 1 : 0.5;
};

volume.oninput = () => audio.volume = volume.value;
audio.volume = 0.75;

audio.ontimeupdate = () => {
  progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  currentTime.textContent = fmt(audio.currentTime);
  duration.textContent = fmt(audio.duration);
};

progress.oninput = () => {
  if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration;
};

audio.onplay = () => {
  playBtn.textContent = "❚❚";
  render();
};

audio.onpause = () => {
  playBtn.textContent = "▶";
  render();
};

// Autoplay Next Song
audio.onended = () => {
  if (repeat) {
    load(index, true, playerBar ? playerBar.classList.contains("expanded") : false);
  } else {
    const nextIndex = shuffle 
      ? Math.floor(Math.random() * tracks.length) 
      : (index + 1) % tracks.length;
    
    load(nextIndex, true, playerBar ? playerBar.classList.contains("expanded") : false);
  }
};

// Mode Buttons & Dynamic Hero Switcher
const heroSection = document.querySelector(".hero");
document.querySelectorAll(".mode-card").forEach((btn, i) => {
  btn.onclick = () => {
    document.querySelectorAll(".mode-card").forEach(x => x.classList.remove("selected"));
    btn.classList.add("selected");

    if (heroSection) {
      heroSection.classList.remove("mode-corporate", "mode-study");
      if (i === 0) heroSection.classList.add("mode-corporate");
      if (i === 1) heroSection.classList.add("mode-study");
    }

    resultsTitle.textContent = btn.querySelector("strong").textContent;
    fetchAudiusTracks(btn.dataset.query);
  };
});

// Search Input Listener
let timer;
searchInput.oninput = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const q = searchInput.value.trim();
    if (q) {
      resultsTitle.textContent = `Search Results for “${q}”`;
      fetchAudiusSearch(q);
    } else {
      selectLanguage(currentLanguage);
    }
  }, 350);
};

document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchInput.focus();
  }
});

// Fetch Audius Trending Tracks
async function fetchAudiusTracks(query = "Bhojpuri") {
  if (status) status.textContent = "Loading...";
  const apiUrl = `${API_BASE}/tracks/search?query=${encodeURIComponent(query)}&app_name=${APP_NAME}`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      tracks = data.data.map(item => ({
        title: item.title,
        artist: item.user.name,
        url: `${API_BASE}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
        art: item.artwork ? item.artwork["480x480"] : null,
        duration: fmt(item.duration)
      }));
      if (status) status.textContent = "Audius API";
      index = 0;
      load(0, false, false);
    } else {
      tracks = [];
      render();
      if (status) status.textContent = "No tracks found";
    }
  } catch (err) {
    console.error("Error fetching tracks:", err);
    if (status) status.textContent = "API Error";
  }
}

// Fetch Audius Search Tracks
async function fetchAudiusSearch(query) {
  if (status) status.textContent = "Searching...";
  const apiUrl = `${API_BASE}/tracks/search?query=${encodeURIComponent(query)}&app_name=${APP_NAME}`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      tracks = data.data.map(item => ({
        title: item.title,
        artist: item.user.name,
        url: `${API_BASE}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
        art: item.artwork ? item.artwork["480x480"] : null,
        duration: fmt(item.duration)
      }));
      if (status) status.textContent = "Audius API";
      index = 0;
      load(0, false, false);
    } else {
      tracks = [];
      render();
      if (status) status.textContent = "No tracks found";
    }
  } catch (err) {
    console.error("Error searching tracks:", err);
    if (status) status.textContent = "API Error";
  }
}

// Initial Date Setup
const d = new Date(), hour = d.getHours();
if (document.getElementById("greeting")) {
  document.getElementById("greeting").textContent = hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
}
if (document.getElementById("dayName")) {
  document.getElementById("dayName").textContent = d.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
}
if (document.getElementById("dateValue")) {
  document.getElementById("dateValue").textContent = d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

// Initialize Navigation & Default View
initUI();
