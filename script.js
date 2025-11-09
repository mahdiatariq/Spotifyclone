console.log('Lets write JavaScript');

let currentSong = new Audio();
let songs = [];
let currFolder = "";

// helper
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}

async function getSongs(folder /* e.g. "songs/ncs" */) {
  currFolder = folder;
  try {
    // fetch directory index (server needs to list directory)
    // let a = await fetch(`${folder}/`);
    async function getSongs(folder /* e.g. "songs/ncs" */) {
      currFolder = folder;
      try {
        // fetch songs.json instead of folder listing
        let res = await fetch(`${folder}/songs.json`);
        if (!res.ok) throw new Error(`${folder}/songs.json not found`);
        songs = await res.json();
    
        // populate song list in the DOM (your existing code)
        const songListContainer = document.querySelector(".songlist ul");
        if (!songListContainer) return songs;
        songListContainer.innerHTML = "";
        for (const song of songs) {
          const displayName = song.replaceAll("%20", " ");
          songListContainer.insertAdjacentHTML('beforeend', `
            <li>
              <img class="invert" width="34" src="music.svg" alt="">
              <div class="info">
                <div>${displayName}</div>
                <div>Artist</div>
              </div>
              <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="">
              </div>
            </li>
          `);
        }
    
        // attach click listeners
        Array.from(document.querySelectorAll(".songlist ul li")).forEach(li => {
          li.addEventListener("click", () => {
            const track = li.querySelector(".info > div")?.textContent?.trim();
            if (track) playMusic(track);
          });
        });
    
        return songs;
      } catch (err) {
        console.error("getSongs error:", err);
        return [];
      }
    }
    
    if (!a.ok) throw new Error(`${folder}/ not found`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let i = 0; i < as.length; i++) {
      let href = as[i].href;
      // keep .mp4 or .mp3 as you use
      if (href.endsWith(".mp4") || href.endsWith(".mp3")) {
        // extract filename relative to folder
        let pieces = href.split(`/${folder}/`);
        let fname = pieces.length > 1 ? pieces[1] : href.split('/').pop();
        songs.push(decodeURIComponent(fname));
      }
    }

    // ensure songlist container exists
    const songListContainer = document.querySelector(".songlist ul");
    if (!songListContainer) {
      console.warn("No .songlist ul found in DOM. Skipping listing songs.");
      return songs;
    }

    songListContainer.innerHTML = "";
    for (const song of songs) {
      const displayName = song.replaceAll("%20", " ");
      songListContainer.insertAdjacentHTML('beforeend', `
        <li>
          <img class="invert" width="34" src="music.svg" alt="">
          <div class="info">
            <div>${displayName}</div>
            <div>Artist</div>
          </div>
          <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="play.svg" alt="">
          </div>
        </li>
      `);
    }

    // attach click listeners safely
    Array.from(document.querySelectorAll(".songlist ul li")).forEach(li => {
      li.addEventListener("click", () => {
        const track = li.querySelector(".info > div")?.textContent?.trim();
        if (track) playMusic(track);
      });
    });

    return songs;
  } catch (err) {
    console.error("getSongs error:", err);
    return [];
  }
}

const playMusic = (track, pause = false) => {
  if (!track) return;
  currentSong.src = `${currFolder}/${track}`;
  document.querySelector(".songinfo") && (document.querySelector(".songinfo").textContent = decodeURI(track));
  document.querySelector(".songtime") && (document.querySelector(".songtime").textContent = "00:00 / 00:00");
  if (!pause) {
    currentSong.play().catch(e => console.warn("Play prevented:", e));
    const playImg = document.getElementById("play");
    if (playImg) playImg.src = "pause.svg";
  }
};

async function displayAlbums() {
  console.log("displaying albums");
  try {
    let a = await fetch(`songs/`);
    if (!a.ok) throw new Error("/songs/ not found");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = Array.from(div.getElementsByTagName("a"));
    let cardContainer = document.querySelector(".card-container");
    if (!cardContainer) {
      console.warn("No .card-container in DOM");
      return;
    }

    for (const e of anchors) {
      if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
        let folder = e.href.split("/").slice(-2)[0]; // folder name
        // try to read metadata; if missing, skip gracefully
        try {
          let m = await fetch(`songs/${folder}/info.json`);

          let meta = m.ok ? await m.json() : { title: folder, description: "" };
          // build card
          cardContainer.insertAdjacentHTML('beforeend', `
            <div class="card" data-folder="${folder}">
            <div class="play">
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="#1DB954"/>
              <path d="M20 33V15L34 24L20 33Z" fill="black"/>
            </svg>
          </div>
          
              <img src="/songs/${folder}/cover.jpg" alt="${meta.title || folder}">
              <h2>${meta.title || folder}</h2>
              <p>${meta.description || ""}</p>
            </div>
          `);
        } catch (er) {
          console.warn("Couldn't load meta for", folder, er);
        }
      }
    }

    // after cards inserted, attach listeners
    Array.from(cardContainer.getElementsByClassName("card")).forEach(card => {
      card.addEventListener("click", async () => {
        const folderName = card.dataset.folder;
        if (!folderName) return;
        songs = await getSongs(`songs/${folderName}`);
        if (songs.length) playMusic(songs[0]);
      });
    });

  } catch (err) {
    console.error("displayAlbums error:", err);
  }

  
}

async function main() {
  // load songs from default folder
  await getSongs("songs/ncs");
  if (songs.length) playMusic(songs[0], true);

  // show albums/cards
  await displayAlbums();

  // wire up play/pause if element exists
  const playBtn = document.getElementById("play");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (currentSong.paused) {
        currentSong.play();
        playBtn.src = "pause.svg";
      } else {
        currentSong.pause();
        playBtn.src = "play.svg";
      }
    });
  }

  // timeupdate
  currentSong.addEventListener("timeupdate", () => {
    const songtimeEl = document.querySelector(".songtime");
    if (songtimeEl && currentSong.duration > 0) {
      songtimeEl.textContent = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
      const circle = document.querySelector(".circle");
      if (circle && currentSong.duration > 0) {
        circle.style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
      }
    }
  });

  // seekbar
  const seekbar = document.querySelector(".seekbar");
  if (seekbar) {
    seekbar.addEventListener("click", e => {
      const rect = seekbar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      document.querySelector(".circle").style.left = (percent * 100) + "%";
      if (currentSong.duration) currentSong.currentTime = currentSong.duration * percent;
    });
  }

  // hamburger & close
  document.querySelector(".hamburger")?.addEventListener("click", () => document.querySelector(".left").style.left = "0");
  document.querySelector(".close")?.addEventListener("click", () => document.querySelector(".left").style.left = "-120%");

  // prev / next
  document.getElementById("previous")?.addEventListener("click", () => {
    currentSong.pause();
    const idx = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (idx > 0) playMusic(songs[idx - 1]);
  });
  document.getElementById("next")?.addEventListener("click", () => {
    currentSong.pause();
    const idx = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (idx >= 0 && idx + 1 < songs.length) playMusic(songs[idx + 1]);
  });

  // volume control (input inside .volume)
  const volInput = document.querySelector(".volume input[type='range']");
  const volImg = document.querySelector(".volume img");
  if (volInput) {
    volInput.addEventListener("input", (e) => {
      currentSong.volume = parseInt(e.target.value, 10) / 100;
      if (currentSong.volume > 0) volImg && (volImg.src = volImg.src.replace("mute.svg", "volume.svg"));
    });
  }

  if (volImg) {
    volImg.addEventListener("click", () => {
      if (volImg.src.includes("volume.svg")) {
        volImg.src = volImg.src.replace("volume.svg", "mute.svg");
        currentSong.volume = 0;
        if (volInput) volInput.value = 0;
      } else {
        volImg.src = volImg.src.replace("mute.svg", "volume.svg");
        currentSong.volume = 0.10;
        if (volInput) volInput.value = 10;
      }
    });
  }
}

main();
