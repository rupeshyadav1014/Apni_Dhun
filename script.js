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

// Audius API Configuration
const APP_NAME = "ApniDhunPlayer";
const API_BASE = "https://discoveryprovider.audius.co/v1";

let tracks = [];
let index = 0, shuffle = false, repeat = false;

function fmt(s) {
  if (!Number.isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

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
    el.innerHTML = `
      <div class="thumb">${t.art ? `<img src="${t.art}" alt="">` : "♫"}</div>
      <div>
        <div class="track-title">${escapeHtml(t.title)}</div>
        <div class="track-artist">${escapeHtml(t.artist || "Unknown artist")}</div>
      </div>
      <div class="track-meta">${t.duration || "Full"}</div>
      <button class="track-play">${i === index && !audio.paused ? "❚❚" : "▶"}</button>
    `;
    el.querySelector(".track-play").onclick = () => load(i, true);
    el.onclick = (e) => {
      if (!e.target.closest("button")) load(i, true);
    };
    trackList.appendChild(el);
  });
}

function load(i, autoplay = false) {
  if (!tracks[i]) return;
  index = i;
  const t = tracks[i];
  audio.src = t.url;
  nowTitle.textContent = t.title;
  nowArtist.textContent = t.artist || "Unknown artist";
  cover.innerHTML = t.art ? `<img src="${t.art}" alt="">` : "♫";
  render();
  if (autoplay) audio.play().catch(() => {});
}

function playPause() {
  if (!tracks.length) return;
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

playBtn.onclick = playPause;
document.getElementById("nextBtn").onclick = () => load(shuffle ? Math.floor(Math.random() * tracks.length) : (index + 1) % tracks.length, true);
document.getElementById("prevBtn").onclick = () => load((index - 1 + tracks.length) % tracks.length, true);

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
  if (repeat) load(index, true);
  else document.getElementById("nextBtn").click();
};

// Mode Buttons Event Listeners
document.querySelectorAll(".mode-card").forEach(btn => btn.onclick = () => {
  document.querySelectorAll(".mode-card").forEach(x => x.classList.remove("selected"));
  btn.classList.add("selected");
  resultsTitle.textContent = btn.querySelector("strong").textContent;
  fetchAudiusTracks(btn.dataset.query);
});

// Search Input Listener with Debounce
let timer;
searchInput.oninput = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const q = searchInput.value.trim();
    if (q) {
      resultsTitle.textContent = `Results for “${q}”`;
      fetchAudiusSearch(q);
    } else {
      resultsTitle.textContent = "Made for focus";
      fetchAudiusTracks("Ambient");
    }
  }, 350);
};

document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchInput.focus();
  }
});

// Audius Genre Trending Fetch Implementation
async function fetchAudiusTracks(genre = "Ambient") {
  if (status) status.textContent = "Searching...";
  const apiUrl = `${API_BASE}/tracks/trending?genre=${encodeURIComponent(genre)}&app_name=${APP_NAME}`;

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
      load(0, false);
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

// Audius Search Fetch Implementation
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
      load(0, false);
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

// Load Default Focus Tracks on Page Load
fetchAudiusTracks("Ambient");
