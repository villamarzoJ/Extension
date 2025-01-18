import React from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const style = { minWidth: 300 };

  async function getUserClicks() {
    let userClicks = await chrome.storage.local
      .get({ userClicks: [] })
      .then((data) => data.userClicks);

    console.log("userClicks:");
    console.log(userClicks);
  }

  async function getUserID() {
    let userID = await chrome.storage.local
      .get("userID")
      .then((data) => data.userID);

    console.log("userID:");
    console.log(userID);
  }

  async function clearData() {
    await chrome.storage.local.clear();
    console.log("cleared extension's local storage");
  }

  return (
    <div style={style}>
      <h1>E-commerce User Behavior Collection Extension</h1>
      <div>Look around Shopee and Lazada, and come back here!</div>

      <button onClick={getUserClicks}>Check User Clicks</button>
      <button onClick={getUserID}>Check UserID</button>
      <button onClick={clearData}>Clear Data</button>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
