import { realtime_factor, url } from "./configuration.js";

var audio;
var loading = document.getElementById("loading");
var audioblob;
var controlarea = document.getElementById("controlArea");
var estimatedTime = document.getElementById("estimatedTime");

const init = async () => {
  chrome.storage.local.get(["speaker"]).then((result1) => {
    chrome.storage.local.get(["text"]).then(async (result) => {
      loading.innerHTML = "prošu čakać ...";
      controlarea.style = "display: none;";
      let estimatedTime_int = (
        (result.text.length / 11) *
        realtime_factor
      ).toFixed();
      var speaker;
      if (result1.speaker === undefined) {
        const response = await fetch(`${url}/api/fetch_speakers/`);
        const data = await response.json();

        chrome.storage.sync.set({ speaker: Object.values(data)[0].id });
        speaker = Object.values(data)[0].id;
        console.log(Object.values(data)[0].id);
      } else {
        speaker = result1.speaker;
      }
      console.log(speaker);
      estimatedTime.innerHTML = `trochowany čas ${estimatedTime_int}s`;
      let interval = setInterval(() => {
        if (estimatedTime_int != 0) {
          estimatedTime_int--;
          estimatedTime.innerHTML = `trochowany čas ${estimatedTime_int}s`;
        }
      }, 1000);
      fetch(`${url}/api/tts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: result.text,
          speaker_id: speaker,
        }),
      }).then((response) => {
        response.blob().then((blob) => {
          clearInterval(interval);
          console.log(blob);
          audioblob = blob;
          if (blob.type != "audio/mpeg") {
            var myReader = new FileReader();
            myReader.onload = function (event) {
              console.log(JSON.stringify(myReader.result));
            };
            myReader.readAsText(blob);
          }
          let blobUrl = URL.createObjectURL(blob);

          audio = new Audio(blobUrl);
          audio.play();
          loading.innerHTML = "";
          estimatedTime.innerHTML = "";
          controlarea.style = "display: flex;";
        });
      });
    });
  });
};

const pause_play = () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
};

const restart = () => {
  audio.currentTime = 0;
  audio.play();
};

const dowload = () => {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  let url = window.URL.createObjectURL(audioblob);
  a.href = url;
  a.download = "bamborak.mp3";
  a.click();
  window.URL.revokeObjectURL(url);
};

document.getElementById("play_pause").addEventListener("click", pause_play);
document.getElementById("restart").addEventListener("click", restart);
document.getElementById("dowload").addEventListener("click", dowload);

init();
