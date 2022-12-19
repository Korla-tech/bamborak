const sorbianchars = /[čČćĆěĚłŁńŃóÓřŘŕŔšŠśŚžŽźŹ]/g;
const germanchars = /[äöüÄÖÜß]/g;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "menuid_bamborak",
    title: "předčitać dać",
    contexts: ["selection"],
  });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let result;
  result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => getSelection().toString(),
  });
  var inputtext = result[0].result;
  inputtext = inputtext.trim();
  let count_sorbian_chars = 0;
  while (sorbianchars.test(inputtext)) {
    ++count_sorbian_chars;
  }
  let count_german_chars = 0;
  while (germanchars.test(inputtext)) {
    ++count_german_chars;
  }
  let language = "";
  if (count_sorbian_chars > count_german_chars) {
    language = "hsb";
  } else {
    language = "de";
  }
  if (language == "de") {
    let url =
      "https://sotra.app/?uri=/ws/translate/&_lang=de&api_key=KORLA_BAIER_ONLY_CHROME_WEBEXTENSION";
    await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        direction: "de_hsb",
        warnings: false,
        translationtype: "lsf",
        text: inputtext,
      }),
    }).then((response) => {
      response.json().then((data) => {
        inputtext = data.output_text.replaceAll("¶", " ");
        chrome.storage.local.set({ text: inputtext }).then(() => {
          chrome.windows.create({
            type: "popup",
            url: "./html/popup.html",
            width: 500,
            height: 200,
          });
        });
      });
    });
  } else {
    chrome.storage.local.set({ text: inputtext }).then(() => {
      chrome.windows.create({
        type: "popup",
        url: "./html/popup.html",
        width: 500,
        height: 200,
      });
    });
  }
});
