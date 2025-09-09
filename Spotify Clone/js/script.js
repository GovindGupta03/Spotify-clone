
let currentSong = new Audio();
let songs;
let currFolder;

function convertSecondsToMinSec(seconds) {
    if (seconds === undefined || isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`${folder}`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }

    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li> <img class="invert" src="img/music.svg" alt="">
                            <div class="info">
                                <div>${song.replaceAll("%20", "")}</div>
                                <div>Honey Singh</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`;
    }

    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })
    })
    return songs
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track
    if (!pause) {
        currentSong.play()
        play.src = "img/pause.svg"
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"

}

async function displayAlbums() {
    let response = await fetch("/songs/");
    if (!response.ok) throw new Error("Failed to fetch songs directory");

    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    if (!cardContainer) {
        console.error("Card container not found!");
        return;
    }

    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("/songs/")) {
            let url = new URL(e.href);
            let folder = url.pathname.split('/').filter(Boolean).pop();


            let metadataResponse = await fetch(`/songs/${folder}/info.json`);
            if (!metadataResponse.ok) throw new Error(`Metadata for ${folder} not found`);

            let albumInfo = await metadataResponse.json();

            // Add elements without removing existing ones
            cardContainer.insertAdjacentHTML('beforeend', `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="${albumInfo.title}">
                    <h2>${albumInfo.title}</h2>
                    <p>${albumInfo.artistName}</p>
                </div>
            `);
        }
    }

    document.querySelectorAll(".card").forEach(e => {
        e.addEventListener("click", async item => {
            let folder = item.currentTarget.dataset.folder;
            if (!folder) {
                console.error("Folder attribute missing!");
                return;
            }
            songs = await getSongs(`songs/${folder}`);
            playMusic(songs[0])
        });
    });
}


async function main() {
    // Get the list of all the songs
    await getSongs("songs/ncs")
    playMusic(songs[0], true)

    // Display all the albums on the page
    displayAlbums()

    //event listener to play,next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "img/pause.svg"
        }
        else {
            currentSong.pause()
            play.src = "img/play.svg"
        }
    })

    // timeupdate event listener
    currentSong.addEventListener("timeupdate", () => {
        const currentTime = convertSecondsToMinSec(currentSong.currentTime || 0);
        const duration = convertSecondsToMinSec(currentSong.duration || 0);

        // Update the display with formatted time
        document.querySelector(".songtime").innerHTML = `${currentTime} / ${duration}`;

        // Update seekbar
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";

        //event listener to seekbar
        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = ((currentSong.duration) * percent) / 100
        })
    });

    // event listener to hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    //event listener to close
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    // event listener to previous
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    //event listener to next
    next.addEventListener("click", () => {
        currentSong.pause()
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    // event to listener volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100");
        currentSong.volume = parseInt(e.target.value) / 100
    })

    // event to listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
}

main()

// var client_id = 'CLIENT_ID';
// var client_secret = 'CLIENT_SECRET';

// var authOptions = {
//     url: 'https://accounts.spotify.com/api/token',
//     headers: {
//         'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
//     },
//     form: {
//         grant_type: 'client_credentials'
//     },
//     json: true
// };

// request.post(authOptions, function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//         var token = body.access_token;
//     }
// });
