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

let tracks = [
  {title:"Focus", artist:"Apni Dhun", url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
  {title:"Work Mode", artist:"Apni Dhun", url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"},
  {title:"Study Session", artist:"Apni Dhun", url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"},
  {title:"After Hours", artist:"Apni Dhun", url:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"}
];
let index = 0, shuffle = false, repeat = false;

function fmt(s){ if(!Number.isFinite(s)) return "0:00"; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`; }
function render(list=tracks){
  trackList.innerHTML="";
  list.forEach((t,i)=>{
    const el=document.createElement("div"); el.className="track"+(i===index?" active":"");
    el.innerHTML=`<div class="thumb">${t.art?`<img src="${t.art}" alt="">`:"♫"}</div>
      <div><div class="track-title">${escapeHtml(t.title)}</div><div class="track-artist">${escapeHtml(t.artist||"Unknown artist")}</div></div>
      <div class="track-meta">${t.duration||""}</div><button class="track-play">${i===index&&!audio.paused?"❚❚":"▶"}</button>`;
    el.querySelector(".track-play").onclick=()=>load(i,true);
    el.onclick=(e)=>{if(!e.target.closest("button"))load(i,true)};
    trackList.appendChild(el);
  });
}
function escapeHtml(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function load(i,autoplay=false){
  if(!tracks[i])return; index=i; const t=tracks[i]; audio.src=t.url;
  nowTitle.textContent=t.title; nowArtist.textContent=t.artist||"Unknown artist";
  cover.innerHTML=t.art?`<img src="${t.art}" alt="">`:"♫";
  render();
  if(autoplay) audio.play().catch(()=>{});
}
function playPause(){ if(audio.paused) audio.play().catch(()=>{}); else audio.pause(); }
playBtn.onclick=playPause;
document.getElementById("nextBtn").onclick=()=>load(shuffle?Math.floor(Math.random()*tracks.length):(index+1)%tracks.length,true);
document.getElementById("prevBtn").onclick=()=>load((index-1+tracks.length)%tracks.length,true);
document.getElementById("shuffleBtn").onclick=()=>{shuffle=!shuffle; document.getElementById("shuffleBtn").style.opacity=shuffle?1:.5};
document.getElementById("repeatBtn").onclick=()=>{repeat=!repeat; document.getElementById("repeatBtn").style.opacity=repeat?1:.5};
volume.oninput=()=>audio.volume=volume.value;
audio.volume=.75;
audio.ontimeupdate=()=>{progress.value=audio.duration?(audio.currentTime/audio.duration)*100:0;currentTime.textContent=fmt(audio.currentTime);duration.textContent=fmt(audio.duration)};
progress.oninput=()=>{if(audio.duration)audio.currentTime=(progress.value/100)*audio.duration};
audio.onplay=()=>{playBtn.textContent="❚❚";render()};
audio.onpause=()=>{playBtn.textContent="▶";render()};
audio.onended=()=>{if(repeat)load(index,true);else document.getElementById("nextBtn").click()};

document.querySelectorAll(".mode-card").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".mode-card").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");
  resultsTitle.textContent=btn.querySelector("strong").textContent;
  searchDemo(btn.dataset.query);
});
let timer;
searchInput.oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>searchDemo(searchInput.value.trim()),250)};
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();searchInput.focus()}});
function searchDemo(q){
  if(!q){render();status.textContent="Demo library";return}
  resultsTitle.textContent=`Results for “${q}”`;
  status.textContent="Ready for API";
  // Replace this function with your chosen free music API.
  const filtered=tracks.filter(t=>(t.title+" "+t.artist).toLowerCase().includes(q.toLowerCase()));
  render(filtered.length?filtered:tracks);
}

const d=new Date(), hour=d.getHours();
document.getElementById("greeting").textContent=hour<12?"Good morning.":hour<18?"Good afternoon.":"Good evening.";
document.getElementById("dayName").textContent=d.toLocaleDateString(undefined,{weekday:"long"}).toUpperCase();
document.getElementById("dateValue").textContent=d.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});
load(0,false);
