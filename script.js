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

const APP_NAME = "ApniDhunPlayer";
const API_BASE = "https://discoveryprovider.audius.co/v1";

// Directory with Language and Singers
const ARTIST_DIRECTORY = {
  "Bhojpuri": ["Pawan Singh", "Khesari Lal Yadav", "Manoj Tiwari", "Shilpi Raj", "Akshara Singh", "Arvind Akela Kallu"],
  "Hindi": ["Arijit Singh", "Shreya Ghoshal", "Jubin Nautiyal", "Neha Kakkar", "A.R. Rahman", "Sonu Nigam"],
  "Punjabi": ["Diljit Dosanjh", "Sidhu Moose Wala", "AP Dhillon", "Karan Aujla", "Guru Randhawa"],
  "English": ["Taylor Swift", "Ed Sheeran", "The Weeknd", "Drake", "Dua Lipa", "Justin Bieber"],
  "Telugu": ["Sid Sriram", "Devi Sri Prasad", "Armaan Malik", "Anirudh Ravichander"],
  "Tamil": ["Anirudh Ravichander", "A.R. Rahman", "Sid Sriram", "Yuvan Shankar Raja"],
  "Kannada": ["Sanjith Hegde", "Sonu Nigam", "Vijay Prakash"],
  "Bengali": ["Anupam Roy", "Jeet Gannguli", "Arijit Singh"],
  "Marathi": ["Ajay-Atul", "Swapnil Bandodkar", "Adarsh Shinde"]
};

let currentLanguage = "Bhojpuri";
let selectedArtist = null;
let tracks = [];
let index = 0, shuffle = false, repeat = false;

// Initialize 3-Step Section UI
function initFlowUI() {
  const container = document.getElementById("flowContainer");
  if (!container) return;

  container.innerHTML = `
    <!-- Step 1: Language Tabs -->
    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 18px; border-radius: 20px; margin-bottom: 16px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #ff3366; font-weight: 700; margin-bottom: 12px;">Step 1: Choose Language</div>
      <div id="langChips" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none;"></div>
    </div>

    <!-- Step 2: Singer Directory -->
    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 18px; border-radius: 20px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #ff3366; font-weight: 700;">Step 2: Choose Singer</div>
        <span id="activeLangTag" style="font-size: 12px; font-weight: 600; background: rgba(255, 51, 102, 0.15); color: #ff3366; padding: 4px 12px; border-radius: 12px;">Bhojpuri</span>
      </div>
      <div id="singerGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px;"></div>
    </div>
  `;

  renderLanguages();
  selectLanguage("Bhojpuri");
}

function renderLanguages() {
  const chips = document.getElementById("langChips");
  if (!chips) return;

  chips.innerHTML = Object.keys(ARTIST_DIRECTORY).map(lang => {
    const active = lang === currentLanguage;
    return `
      <button onclick="selectLanguage('${lang}')" style="
        padding: 10px 20px;
        border-radius: 30px;
        border: 1px solid ${active ? '#ff3366' : 'rgba(255, 255, 255, 0.12)'};
        background: ${active ? 'linear-gradient(135deg, #ff3366, #ff6633)' : 'rgba(255, 255, 255, 0.05)'};
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: ${active ? '0 4px 15px rgba(255, 51, 102, 0.4)' : 'none'};
        transition: all 0.2s ease;
      ">${lang}</button>
    `;
  }).join('');
}

window.selectLanguage = function(lang) {
  currentLanguage = lang;
  selectedArtist = null;
  
  renderLanguages();

  const tag = document.getElementById("activeLangTag");
  if (tag) tag.textContent = `${lang} Singers`;

  renderSingers(ARTIST_DIRECTORY[lang] || []);
  
  resultsTitle.textContent = `Trending ${lang} Songs`;
  fetchAudiusTracks(lang);
};

function renderSingers(singers) {
  const grid = document.getElementById("singerGrid");
  if (!grid) return;

  grid.innerHTML = singers.map(singer => {
    const isSelected = singer === selectedArtist;
    return `
      <div onclick="selectSinger('${singer}')" style="
        background: ${isSelected ? 'linear-gradient(145deg, rgba(255, 51, 102, 0.25), rgba(255, 102, 51, 0.15))' : 'rgba(255, 255, 255, 0.03)'};
        border: 1px solid ${isSelected ? '#ff3366' : 'rgba(255, 255, 255, 0.08)'};
        border-radius: 16px;
        padding: 14px 10px;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s, background 0.2s;
      " onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
        <div style="
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff3366, #7928ca);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          font-weight: 800;
          font-size: 20px;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        ">${singer.charAt(0)}</div>
        <div style="font-size: 12px; font-weight: 600; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${singer}</div>
      </div>
    `;
  }).join('');
}

window.selectSinger = function(singer) {
  selectedArtist = singer;
  renderSingers(ARTIST_DIRECTORY[currentLanguage] || []);
  resultsTitle.textContent = `${singer} — ${currentLanguage} Songs`;
  fetchAudiusSearch(`${singer} ${currentLanguage}`);
};

function renderTrackList(list = tracks) {
  trackList.innerHTML = "";
  if (!list.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  list.forEach((t, i) => {
    const el = document.createElement("div");
    el.className = "track" + (i === index ? " active" : "");
    el.style.cssText = `
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 14px;
      margin-bottom: 8px;
      background: ${i === index ? 'rgba(255, 51, 102, 0.12)' : 'rgba(255, 255, 255, 0.02)'};
      border: 1px solid ${i === index ? 'rgba(255, 51, 102, 0.4)' : 'rgba(255, 255, 255, 0.05)'};
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    el.innerHTML = `
      <div style="font-weight: 700; font-size: 13px; width: 28px; text-align: center; color: ${i === index ? '#ff3366' : 'rgba(255,255,255,0.4)'};">#${i + 1}</div>
      <div style="width: 44px; height: 44px; border-radius: 10px; overflow: hidden; background: #222; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        ${t.art ? `<img src="${t.art}" style="width: 100%; height: 100%; object-fit: cover;">` : "♫"}
      </div>
      <div style="flex: 1; overflow: hidden;">
        <div style="font-size: 14px; font-weight: 600; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHtml(t.title)}</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.6); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHtml(t.artist || "Unknown artist")}</div>
      </div>
      <div style="font-size: 12px; color: rgba(255,255,255,0.5); font-variant-numeric: tabular-nums;">${t.duration || "Full"}</div>
      <button class="track-play-btn" style="background: none; border: none; font-size: 16px; color: ${i === index ? '#ff3366' : '#fff'}; cursor: pointer;">${i === index && !audio.paused ? "❚❚" : "▶"}</button>
    `;

    el.onclick = () => loadTrack(i, true);
    trackList.appendChild(el);
  });
}

function loadTrack(i, autoplay = false) {
  if (!tracks[i]) return;
  index = i;
  const t = tracks[i];
  audio.src = t.url;
  nowTitle.textContent = t.title;
  nowArtist.textContent = t.artist || "Unknown artist";
  cover.innerHTML = t.art ? `<img src="${t.art}" alt="" style="width:100%;height:100%;object-fit:cover;">` : "♫";
  renderTrackList();
  
  if (autoplay) audio.play().catch(() => {});
}

function playPause() {
  if (!tracks.length) return;
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

playBtn.onclick = playPause;
document.getElementById("nextBtn").onclick = () => loadTrack(shuffle ? Math.floor(Math.random() * tracks.length) : (index + 1) % tracks.length, true);
document.getElementById("prevBtn").onclick = () => loadTrack((index - 1 + tracks.length) % tracks.length, true);

document.getElementById("shuffleBtn").onclick = () => {
  shuffle = !shuffle;
  document.getElementById("shuffleBtn").style.opacity = shuffle ? 1 : 0.4;
};
document.getElementById("repeatBtn").onclick = () => {
  repeat = !repeat;
  document.getElementById("repeatBtn").style.opacity = repeat ? 1 : 0.4;
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
  renderTrackList();
};

audio.onpause = () => {
  playBtn.textContent = "▶";
  renderTrackList();
};

// Autoplay next track on completion
audio.onended = () => {
  if (repeat) {
    loadTrack(index, true);
  } else {
    const nextIdx = shuffle ? Math.floor(Math.random() * tracks.length) : (index + 1) % tracks.length;
    loadTrack(nextIdx, true);
  }
};

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

async function fetchAudiusTracks(query) {
  if (status) status.textContent = "Loading...";
  try {
    const res = await fetch(`${API_BASE}/tracks/search?query=${encodeURIComponent(query)}&app_name=${APP_NAME}`);
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
      loadTrack(0, false);
    } else {
      tracks = [];
      renderTrackList();
      if (status) status.textContent = "No tracks";
    }
  } catch (err) {
    if (status) status.textContent = "API Error";
  }
}

async function fetchAudiusSearch(query) {
  if (status) status.textContent = "Searching...";
  try {
    const res = await fetch(`${API_BASE}/tracks/search?query=${encodeURIComponent(query)}&app_name=${APP_NAME}`);
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
      loadTrack(0, false);
    } else {
      tracks = [];
      renderTrackList();
      if (status) status.textContent = "No tracks";
    }
  } catch (err) {
    if (status) status.textContent = "API Error";
  }
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

initFlowUI();
