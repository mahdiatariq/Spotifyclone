console.log('Lets write JavaScript');

let currentSong = new Audio();
let songs = [];
let currFolder = "";

// helper to format time
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}

// fetch songs from songs.json in each folder
async function getSongs(folder) {
  currFolder = folder;
  try {
    let res = await fetch(`${folder}/songs.json`);
    if (!res.ok) throw new Error(`${folder}/songs.json not found`);
    songs = await res.json();

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

// play a song
const playMusic = (track, pause = false) => {
  if (!track) return;
  currentSong.src = `${currFolder}/${track}`;
  const songInfoEl = document.querySelector(".songinfo");
  if (songInfoEl) songInfoEl.textContent = decodeURI(track);
  const songTimeEl = document.querySelector(".songtime");
  if (songTimeEl) songTimeEl.textContent = "00:00 / 00:00";

  if (!pause) {
    currentSong.play().catch(e => console.warn("Play prevented:", e));
    const playImg = document.getElementById("play");
    if (playImg) playImg.src = "pause.svg";
  }
};

// display albums/cards
async function displayAlbums() {
  const cardContainer = document.querySelector(".card-container");
  if (!cardContainer) return;

  const folders = [
    "chill song",
    "coding mood",
    "cs",
    "Dark Mood",
    "Exercise Mood",
    "happy mood",
    "love mood",
    "morning mood",
    "ncs",
    "night song",
    "traveling mood"
  ];

  for (const folder of folders) {
    try {
      const res = await fetch(`songs/${folder}/info.json`);
      const meta = res.ok ? await res.json() : { title: folder, description: "" };

      cardContainer.insertAdjacentHTML('beforeend', `
        <div class="card" data-folder="${folder}">
          <div class="play">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="24" fill="#1DB954"/>
              <path d="M20 33V15L34 24L20 33Z" fill="black"/>
            </svg>
          </div>
          <img src="songs/${folder}/cover.jpg" alt="${meta.title || folder}">
          <h2>${meta.title || folder}</h2>
          <p>${meta.description || ""}</p>
        </div>
      `);

      cardContainer.querySelector(`.card[data-folder="${folder}"]`).addEventListener("click", async () => {
        songs = await getSongs(`songs/${folder}`);
        if (songs.length) playMusic(songs[0]);
      });

    } catch (err) {
      console.warn("Could not load info for folder:", folder, err);
    }
  }
}

// main
async function main() {
  // load default folder (first album)
  await getSongs("ncs");
  if (songs.length) playMusic(songs[0], true);

  await displayAlbums();

  // play/pause button
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

  // time update
  currentSong.addEventListener("timeupdate", () => {
    const songtimeEl = document.querySelector(".songtime");
    if (songtimeEl && currentSong.duration > 0) {
      songtimeEl.textContent = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
      const circle = document.querySelector(".circle");
      if (circle) circle.style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    }
  });

  // seekbar
  const seekbar = document.querySelector(".seekbar");
  if (seekbar) {
    seekbar.addEventListener("click", e => {
      const rect = seekbar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const circle = document.querySelector(".circle");
      if (circle) circle.style.left = (percent * 100) + "%";
      if (currentSong.duration) currentSong.currentTime = currentSong.duration * percent;
    });
  }

  // hamburger & close
  document.querySelector(".hamburger")?.addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close")?.addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

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

  // volume
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
        currentSong.volume = 0.1;
        if (volInput) volInput.value = 10;
      }
    });
  }
}

main();
