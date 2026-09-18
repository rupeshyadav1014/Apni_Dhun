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

// Global App State & User Profile Storage
let tracks = [];
let index = 0, shuffle = false, repeat = false;

let userProfile = JSON.parse(localStorage.getItem("apnidhun_user_profile")) || {
  languages: ["English", "Hindi"],
  followedArtists: ["Arijit Singh", "Taylor Swift", "ARRahman"],
  searchCategory: "all" // 'all', 'track', 'artist', 'album'
};

function saveProfile() {
  localStorage.setItem("apnidhun_user_profile", JSON.stringify(userProfile));
}

// Inject Onboarding & Preference Controls
function initNavigationControls() {
  const content = document.querySelector(".content");
  if (!content || document.getElementById("prefBar")) return;

  const prefBar = document.createElement("div");
  prefBar.id = "prefBar";
  prefBar.style.cssText = "display: flex; gap: 12px; wrap: flex-wrap; margin-bottom: 20px; align-items: center;";
  
  prefBar.innerHTML = `
    <div style="display: flex; gap: 6px; align-items: center;">
      <span style="font-size: 12px; font-weight: 600;">Languages:</span>
      <select id="langSelect" multiple style="border-radius: 8px; padding: 4px 8px; font-size: 12px; border: 1px solid var(--line); background: var(--card);">
        ${["English", "Hindi", "Punjabi", "Telugu", "Tamil", "Kannada", "Bengali", "Marathi"].map(l => 
          `<option value="${l}" ${userProfile.languages.includes(l) ? 'selected' : ''}>${l}</option>`
        ).join('')}
      </select>
    </div>
    <div style="display: flex; gap: 6px; align-items: center;">
      <span style="font-size: 12px; font-weight: 600;">Search In:</span>
      <select id="catSelect" style="border-radius: 8px; padding: 4px 8px; font-size: 12px; border: 1px solid var(--line); background: var(--card);">
        <option value="all">All</option>
        <option value="track">Tracks</option>
        <option value="artist">Artists</option>
        <option value="album">Albums</option>
      </select>
    </div>
    <div id="artistFollowPills" style="display: flex; gap: 6px; overflow-x: auto; font-size: 12px;"></div>
  `;

  content.insertBefore(prefBar, content.firstChild);

  document.getElementById("langSelect").onchange = (e) => {
    userProfile.languages = Array.from(e.target.selectedOptions).map(o => o.value);
    saveProfile();
    fetchTop30Charts();
  };

  document.getElementById("catSelect").onchange = (e) => {
    userProfile.searchCategory = e.target.value;
    saveProfile();
    if (searchInput.value.trim()) fetchAudiusSearch(searchInput.value.trim());
  };

  renderArtistPills();
}

function renderArtistPills() {
  const container = document.getElementById("artistFollowPills");
  if (!container) return;
  container.innerHTML = `<span style="font-weight: 600;">Following:</span> ` + 
    userProfile.followedArtists.map(a => 
      `<span style="background: var(--accent2); padding: 2px 8px; border-radius: 12px; cursor: pointer;" onclick="searchArtist('${a}')">♥ ${a}</span>`
    ).join('');
}

window.searchArtist = function(artistName) {
  searchInput.value = artistName;
  userProfile.searchCategory = "artist";
  const catSel = document.getElementById("catSelect");
  if (catSel) catSel.value = "artist";
  fetchAudiusSearch(artistName);
};

// Expand/Minimize Console Button Setup
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

// Track List Renderer with Dynamic Chart Indicators & Follow Artist Action
function render(list = tracks) {
  trackList.innerHTML = "";
  if (!list.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  list.forEach((t, i) => {
    const isFollowing = userProfile.followedArtists.includes(t.artist);
    const rankIndicator = t.rankChange > 0 
      ? `<span style="color: #2e7d32; font-size: 11px;">▲ ${t.rankChange}</span>` 
      : t.rankChange < 0 
      ? `<span style="color: #c62828; font-size: 11px;">▼ ${Math.abs(t.rankChange)}</span>` 
      : `<span style="color: var(--muted); font-size: 11px;">•</span>`;

    const el = document.createElement("div");
    el.className = "track" + (i === index ? " active" : "");
    el.innerHTML = `
      <div style="font-weight: 700; font-size: 12px; width: 24px; text-align: center;">#${i + 1}</div>
      <div style="width: 20px;">${rankIndicator}</div>
      <div class="thumb">${t.art ? `<img src="${t.art}" alt="">` : "♫"}</div>
      <div style="flex: 1; overflow: hidden;">
        <div class="track-title">${escapeHtml(t.title)}</div>
        <div class="track-artist">${escapeHtml(t.artist || "Unknown artist")}</div>
      </div>
      <button onclick="event.stopPropagation(); toggleFollowArtist('${escapeHtml(t.artist)}')" style="background: transparent; border: 1px solid var(--line); border-radius: 12px; font-size: 11px; padding: 2px 8px;">
        ${isFollowing ? '✓ Following' : '+ Follow'}
      </button>
      <div class="track-meta">${t.duration || "Full"}</div>
      <button class="track-play">${i === index && !audio.paused ? "❚❚" : "▶"}</button>
    `;
    el.querySelector(".track-play").onclick = () => load(i, true, true);
    el.onclick = (e) => {
      if (!e.target.closest("button")) load(i, true, true);
    };
    trackList.appendChild(el);
  });
}

window.toggleFollowArtist = function(artist) {
  if (!artist || artist === "Unknown artist") return;
  const idx = userProfile.followedArtists.indexOf(artist);
  if (idx > -1) {
    userProfile.followedArtists.splice(idx, 1);
  } else {
    userProfile.followedArtists.push(artist);
  }
  saveProfile();
  renderArtistPills();
  render();
};

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

// Categorized Search Listener
let timer;
searchInput.oninput = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const q = searchInput.value.trim();
    if (q) {
      resultsTitle.textContent = `Results for “${q}” (${userProfile.searchCategory.toUpperCase()})`;
      fetchAudiusSearch(q);
    } else {
      fetchTop30Charts();
    }
  }, 350);
};

document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchInput.focus();
  }
});

// Top 30 Charts with Language Filtering & Ranking Indicators
async function fetchTop30Charts() {
  if (status) status.textContent = "Loading Charts...";
  const langQuery = userProfile.languages.length ? userProfile.languages[0] : "All";
  resultsTitle.textContent = `Top 30 Charts (${langQuery})`;

  const apiUrl = `${API_BASE}/tracks/trending?genre=${encodeURIComponent(langQuery)}&app_name=${APP_NAME}`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      tracks = data.data.slice(0, 30).map((item, idx) => ({
        title: item.title,
        artist: item.user.name,
        url: `${API_BASE}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
        art: item.artwork ? item.artwork["480x480"] : null,
        duration: fmt(item.duration),
        rankChange: (idx % 3 === 0) ? 2 : (idx % 4 === 0) ? -1 : 0 // Dynamic weekly rank shift mockup
      }));
      if (status) status.textContent = "Top 30 Loaded";
      index = 0;
      load(0, false, false);
    } else {
      fetchAudiusTracks("Ambient");
    }
  } catch (err) {
    fetchAudiusTracks("Ambient");
  }
}

// Audius Genre Trending Fetch
async function fetchAudiusTracks(genre = "Ambient") {
  if (status) status.textContent = "Searching...";
  const apiUrl = `${API_BASE}/tracks/trending?genre=${encodeURIComponent(genre)}&app_name=${APP_NAME}`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      tracks = data.data.map((item, idx) => ({
        title: item.title,
        artist: item.user.name,
        url: `${API_BASE}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
        art: item.artwork ? item.artwork["480x480"] : null,
        duration: fmt(item.duration),
        rankChange: 0
      }));
      if (status) status.textContent = "Audius API";
      index = 0;
      load(0, false, false);
    } else {
      tracks = [];
      render();
      if (status) status.textContent = "No tracks";
    }
  } catch (err) {
    console.error("Error fetching Audius tracks:", err);
    if (status) status.textContent = "API Error";
  }
}

// Categorized Search Fetch
async function fetchAudiusSearch(query) {
  if (status) status.textContent = "Searching...";
  const apiUrl = `${API_BASE}/tracks/search?query=${encodeURIComponent(query)}&app_name=${APP_NAME}`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      let filtered = data.data;

      // Filter results by selected category
      if (userProfile.searchCategory === "artist") {
        filtered = filtered.filter(item => item.user.name.toLowerCase().includes(query.toLowerCase()));
      } else if (userProfile.searchCategory === "track") {
        filtered = filtered.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
      }

      tracks = filtered.map(item => ({
        title: item.title,
        artist: item.user.name,
        url: `${API_BASE}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
        art: item.artwork ? item.artwork["480x480"] : null,
        duration: fmt(item.duration),
        rankChange: 0
      }));
      if (status) status.textContent = "Audius API";
      index = 0;
      load(0, false, false);
    } else {
      tracks = [];
      render();
      if (status) status.textContent = "No tracks";
    }
  } catch (err) {
    console.error("Error searching Audius tracks:", err);
    if (status) status.textContent = "API Error";
  }
}

// Initial Date Setup
const d = new Date(), hour = d.getHours();
document.getElementById("greeting").textContent = hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
document.getElementById("dayName").textContent = d.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
document.getElementById("dateValue").textContent = d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

// Initialize Navigation Features & Charts
initNavigationControls();
fetchTop30Charts();
