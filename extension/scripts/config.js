import { url } from "./configuration.js";

const init = () => {
  fetch(`${url}/api/fetch_speakers/`).then((response) => {
    response.json().then((data) => {
      let speaker_select = document.getElementById("speakerSelect");
      let speaker_select_inner_html = "";
      data.map((speaker) => {
        speaker_select_inner_html = `${speaker_select_inner_html}<option value="${speaker.id}">${speaker.name}</option>`;
      });
      speaker_select.innerHTML = speaker_select_inner_html;
    });
  });
};

init();

let speaker_select = document.getElementById("speakerSelect");
speaker_select.addEventListener("change", (e) => {
  chrome.storage.sync.set({ speaker: e.target.value });
});
