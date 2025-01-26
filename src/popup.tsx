import React, { useState } from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const style = { minWidth: 300 };
  const [userClickData, setUserClickData] = useState("");

  async function getUserClicks() {
    let userClicks = await chrome.storage.local
      .get({ userClicks: [] })
      .then((data) => data.userClicks);

    console.log({ userClicks });
    const data = JSON.stringify(userClicks);
    setUserClickData(Buffer.from(data).toString("base64"));
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

      <button onClick={getUserClicks}>Get User Clicks</button>
      <button onClick={getUserID}>Check UserID</button>
      <button onClick={clearData}>Clear Data</button>

      {userClickData.length !== 0 && (
        <div>
          <span> User Clickstream Data: </span>
          <input type="text" readOnly value={userClickData} />
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
