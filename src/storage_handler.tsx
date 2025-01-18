import { UserClick } from "./types/UserClick";

async function addUserClick(click: UserClick) {
  let userClicks: UserClick[] = await chrome.storage.local
    .get({
      userClicks: [],
    })
    .then((data) => data.userClicks);

  userClicks.push(click);
  await chrome.storage.local.set({ userClicks: userClicks });
}

export { addUserClick };
