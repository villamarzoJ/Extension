import { setURLMessage } from "./types/Messages";
import { PlatformEnum, generateUserID } from "./types/UserClick";

async function getPlatform(tabURL: string) {
  const lazadaWebsite = /^https:\/\/.*lazada.com.ph\//;
  const shopeeWebsite = /^https:\/\/.*shopee.ph\//;

  let platform: PlatformEnum;

  if (tabURL.match(lazadaWebsite)) {
    platform = "lazada";
  } else if (tabURL.match(shopeeWebsite)) {
    platform = "shopee";
  } else {
    return;
  }

  console.log({ currentPlatform: platform });
  await chrome.storage.local.set({ currentPlatform: platform });

  return platform;
}

chrome.tabs.onUpdated.addListener(async (_, tabChangeInfo) => {
  let newURL = tabChangeInfo.url;
  if (newURL === undefined) {
    console.log("newURL not defined...");
    return;
  }

  await chrome.storage.local.set({ currentURL: newURL });
  await getPlatform(newURL);
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message !== setURLMessage) {
    return;
  }

  const currentURL = await chrome.tabs
    .query({ active: true, lastFocusedWindow: true })
    .then((data) => {
      if (data.length !== 1) {
        throw new Error("multiple tabs in focus!");
      }

      return data[0].url;
    });

  if (currentURL === undefined) {
    console.log("newURL not defined...");
    return;
  }

  await chrome.storage.local.set({ currentURL: currentURL });
  await getPlatform(currentURL);
});

// add userID
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install" && details.reason !== "update") {
    return;
  }

  let userID = await chrome.storage.local
    .get({ userID: "" })
    .then((data) => data.userID);

  if (userID !== "") {
    return;
  }

  let newUserID = generateUserID();
  await chrome.storage.local.set({ userID: newUserID });
});
