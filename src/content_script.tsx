import { addUserClick } from "./storage_handler";
import { setURLMessage } from "./types/Messages";
import { PlatformEnum, Price, UserClick, UserID } from "./types/UserClick";

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getProductPagePrice() {
  let emptyItemElement = document.querySelector(
    `span.next-input > input[disabled]`
  );
  if (emptyItemElement != null) {
    return null;
  }

  let priceElement = document.querySelector(`span.pdp-price_type_normal`);
  if (priceElement == null) {
    return null;
  }

  const priceText = priceElement?.textContent!;
  const currencyResult = transformPriceText(priceText);
  return currencyResult;
}

function transformPriceText(priceText: string): Price {
  console.log(`priceText: ${priceText}`);

  const value = Number(priceText?.slice(1))!;
  const currency = priceText?.slice(0, 1)!;

  return { value, currency };
}

async function lazadaAddClickEvent(userID: string) {
  let viewTime = new Date();
  chrome.storage.local.set({ viewTime: viewTime });
  console.log(viewTime);

  let productPrice = null;
  for (let attempts = 0; attempts < 2 * 5; attempts++) {
    productPrice = await getProductPagePrice();

    if (productPrice == null) {
      console.log("price refresh?");
      await wait(0.5 * 1000);
      continue;
    }

    break;
  }

  if (productPrice == null) {
    return;
  }

  let userClick: UserClick = {
    platform: "lazada",
    eventTime: viewTime.toString(),
    eventType: "view",
    price: productPrice,
    userId: userID as UserID,
  };

  await addUserClick(userClick);
  console.log("added view product event");

  return productPrice;
}

async function addCartPageListeners(userID: UserID) {
  let cartItems = null;

  for (let attempts = 0; attempts < 2 * 5; attempts++) {
    cartItems = document.querySelectorAll(
      `.checkout-shop-children .cart-item-inner`
    );

    if (cartItems.length !== 0) {
      break;
    }

    console.log("retrying to get cart elements...");
    await wait(0.5 * 1000);
  }

  if (!cartItems || cartItems?.length == 0) {
    return;
  }

  for (const cartItem of cartItems) {
    let productPriceText =
      cartItem.querySelector(".current-price")?.textContent;
    if (!productPriceText) {
      continue;
    }
    let productPrice = transformPriceText(productPriceText);

    let removeFromCartBtn = cartItem.querySelector(`.lazada-ic-Delete`);
    if (!removeFromCartBtn) {
      continue;
    }

    removeFromCartBtn.addEventListener("click", async () => {
      await wait(0.1 * 1000);
      const dialogElement = document.querySelector(`div[role="alertdialog"]`);

      const removeFromCartConfirm =
        dialogElement?.querySelector(".next-btn-primary");
      if (!removeFromCartConfirm) {
        return;
      }

      removeFromCartConfirm.addEventListener("click", async () => {
        let cartRemoveTime = new Date();

        let userClick: UserClick = {
          platform: "lazada",
          eventTime: cartRemoveTime.toString(),
          eventType: "remove_from_cart",
          price: productPrice,
          userId: userID as UserID,
        };

        await addUserClick(userClick);
        console.log("added remove from cart event");
      });
    });
  }
}

async function addProductPageListeners(userID: string, productPrice: Price) {
  let cartConcernButtons = null;
  for (let i = 0; i < 3; i++) {
    cartConcernButtons = document.querySelectorAll(
      `.pdp-cart-concern .add-to-cart-buy-now-btn`
    );

    if (cartConcernButtons.length !== 0) {
      break;
    }

    console.log("retrying finding concern buttons");
    await wait(2 * 1000);
  }

  if (!cartConcernButtons || cartConcernButtons.length == 0) {
    return;
  }

  for (const button of cartConcernButtons) {
    const buttonText = button.querySelector(`.pdp-button-text span`)
      ?.textContent!;

    const addToCartMatches = buttonText.match(/cart/gi);
    if (!addToCartMatches) {
      continue;
    }

    button.addEventListener("click", async () => {
      let cartAddTime = new Date();

      let userClick: UserClick = {
        platform: "lazada",
        eventTime: cartAddTime.toString(),
        eventType: "cart",
        price: productPrice,
        userId: userID as UserID,
      };

      console.log("add added to cart event");
      await addUserClick(userClick);
    });
  }
}

async function addCheckoutPageListeners(userID: string) {
  const itemPrices = document.querySelectorAll(
    "#container_10008 .current-price"
  );

  let prices: Price[] = [];
  for (const item of itemPrices) {
    let priceText = item.textContent!;
    prices.push(transformPriceText(priceText));
  }

  const checkoutElement = document.querySelectorAll(
    "#rightContainer_10010 .checkout-order-total > div"
  );

  for (const el of checkoutElement) {
    if (!el.textContent!.match(/order/gi)) {
      continue;
    }

    el.addEventListener("click", async () => {
      let purchaseTime = new Date();

      for (const productPrice of prices) {
        let userClick: UserClick = {
          platform: "lazada",
          eventTime: purchaseTime.toString(),
          eventType: "purchase", // should be tested
          price: productPrice,
          userId: userID as UserID,
        };

        console.log("add purchase event");
        await addUserClick(userClick);
      }
    });
  }
}

async function addShopeeCartListener(userID: string) {
  let productItems = null;
  for (let i = 0; i < 2 * 5; i++) {
    productItems = document.querySelectorAll(
      `.container section section [role="listitem"]`
    );
    if (productItems.length !== 0) {
      break;
    }

    await wait(0.5 * 1000);
  }
  if (!productItems || productItems.length == 0) {
    return;
  }

  for (const product of productItems) {
    const priceElement = product.querySelector(
      `div > :nth-child(4) > :first-child > :last-child`
    );
    console.log(priceElement);
    const priceText = priceElement?.textContent;

    if (!priceText) {
      continue;
    }
    const productPrice = transformPriceText(priceText);

    const productBtns = product.querySelectorAll(
      `div > div > div:last-child > button`
    );
    let deleteButton = null;
    for (const button of productBtns) {
      if (button.textContent?.match(/delete/i)) {
        deleteButton = button;
      }
    }

    deleteButton!.addEventListener("click", async () => {
      let deletionTime = new Date();

      let userClick: UserClick = {
        platform: "shopee",
        eventTime: deletionTime.toString(),
        eventType: "remove_from_cart",
        price: productPrice,
        userId: userID as UserID,
      };

      console.log("add remove from cart event");
      await addUserClick(userClick);
    });
  }
}

async function shopeeGetProductPagePrice() {
  const priceElement = document.querySelector(
    `section[aria-live="polite"] > div > div`
  );

  if (!priceElement) {
    return;
  }

  const priceText = priceElement?.textContent!;
  const currencyResult = transformPriceText(priceText);

  return currencyResult;
}

async function shopeeAddClickEvent(userID: string) {
  let viewTime = new Date();
  chrome.storage.local.set({ viewTime: viewTime });
  console.log(viewTime);

  let productPrice = null;
  for (let attempts = 0; attempts < 2 * 5; attempts++) {
    productPrice = await shopeeGetProductPagePrice();

    if (productPrice == null) {
      console.log("price refresh?");
      await wait(0.5 * 1000);
      continue;
    }

    break;
  }

  if (productPrice == null) {
    return null;
  }

  let userClick: UserClick = {
    platform: "shopee",
    eventTime: viewTime.toString(),
    eventType: "view",
    price: productPrice,
    userId: userID as UserID,
  };

  await addUserClick(userClick);
  console.log("added view product event");

  return productPrice;
}

async function shopeeAddProductPageListener(
  userID: string,
  productPrice: Price
) {
  const cartButton = document.querySelector(
    `.page-product section.flex-auto > div > div:last-of-type button:first-of-type`
  );
  if (!cartButton) {
    return;
  }

  let isProcessRunning = false;

  cartButton.addEventListener("click", async () => {
    if (isProcessRunning) {
      return;
    }
    isProcessRunning = true;

    let toastNotification = null;
    for (let i = 0; i < 2 * 5; i++) {
      toastNotification = document.querySelectorAll(`.toast__text`);
      if (toastNotification.length !== 0) {
        break;
      }

      await wait(0.5 * 1000);
      console.log("waiting for add to cart notification...");
    }

    if (!toastNotification || toastNotification.length !== 1) {
      console.log("add to cart unsuccessful...");
      return;
    }

    const viewTime = new Date();
    chrome.storage.local.set({ viewTime: viewTime });

    let userClick: UserClick = {
      platform: "shopee",
      eventTime: viewTime.toString(),
      eventType: "cart",
      price: productPrice,
      userId: userID as UserID,
    };

    await addUserClick(userClick);
    console.log("added add to cart event");

    isProcessRunning = false;
  });
}

async function shopeeAddCheckoutListener(userID: string) {
  const orderedRows = document.querySelectorAll(
    `div[role="main"] > div:first-child > div:last-child > div > div > div > div`
  );

  const prices: Price[] = [];
  for (const row of orderedRows) {
    const fiveColumns = row.querySelector(`div > div:nth-child(5)`);
    const sixColumns = row.querySelector(`div > div:nth-child(6)`);
    const hasPictureElement = row.querySelector(`picture`);

    if (fiveColumns && !sixColumns && hasPictureElement) {
      const priceText = row.querySelector(`div:nth-child(3)`)?.textContent;
      if (!priceText) {
        continue;
      }

      prices.push(transformPriceText(priceText));
    }
  }

  const checkoutBtnCandidates = document.querySelectorAll(
    `div[role="main"] > div:last-child button`
  );

  let checkoutButton = null;
  for (const button of checkoutBtnCandidates) {
    if (button.textContent?.match(/order/i)) {
      checkoutButton = button;
    }
  }

  checkoutButton?.addEventListener("click", async () => {
    let purchaseTime = new Date();

    for (const productPrice of prices) {
      let userClick: UserClick = {
        platform: "shopee",
        eventTime: purchaseTime.toString(),
        eventType: "purchase", // should be tested
        price: productPrice,
        userId: userID as UserID,
      };

      console.log("add purchase event");
      await addUserClick(userClick);
    }
  });
}

async function contentScriptRun() {
  chrome.runtime.sendMessage(setURLMessage);
  await wait(0.1 * 1000);

  let userID: UserID = await chrome.storage.local
    .get("userID")
    .then((data) => data.userID);

  let currentPlatform: PlatformEnum = await chrome.storage.local
    .get("currentPlatform")
    .then((data) => data.currentPlatform);

  let tabURL: string = await chrome.storage.local
    .get("currentURL")
    .then((data) => data.currentURL);

  if (currentPlatform === "lazada") {
    const productPage = /^https:\/\/www.lazada.com.ph\/products\//;
    const cartPage = /^https:\/\/cart.lazada.com.ph\//;
    const checkoutPage = /^https:\/\/checkout.lazada.com.ph\//;

    if (tabURL.match(cartPage)) {
      await addCartPageListeners(userID);
      return;
    }

    if (tabURL.match(productPage)) {
      const productPrice = await lazadaAddClickEvent(userID);
      if (!productPrice) {
        return;
      }

      await addProductPageListeners(userID, productPrice);
      return;
    }

    if (tabURL.match(checkoutPage)) {
      console.log("on checkout page");
      await addCheckoutPageListeners(userID);
    }

    return;
  }

  if (currentPlatform === "shopee") {
    const checkoutPage = /^https:\/\/shopee.ph\/checkout/;
    const cartPage = /^https:\/\/shopee.ph\/cart/;

    if (tabURL.match(cartPage)) {
      console.log("on cart page");
      addShopeeCartListener(userID);
      return;
    }

    let mainElement = null;
    for (let attempts = 0; attempts < 2 * 15; attempts++) {
      mainElement = document.querySelector(`#main`);
      if (mainElement) {
        break;
      }

      console.log("retrying to find main...");
      await wait(0.5 * 1000);
    }

    if (!mainElement) {
      console.error("main element took too long to load!");
      return;
    }

    if (tabURL.match(checkoutPage)) {
      console.log("on checkout page");
      await shopeeAddCheckoutListener(userID);
      return;
    }

    let pageProduct = null;
    for (let attempts = 0; attempts < 2 * 5; attempts++) {
      pageProduct = document.querySelector(`.page-product`);
      if (pageProduct) {
        break;
      }

      await wait(0.5 * 1000);
    }

    if (pageProduct) {
      const price = await shopeeAddClickEvent(userID);
      if (!price) {
        return;
      }

      shopeeAddProductPageListener(userID, price);
      return;
    }
  }
}

let currentURL: string;

async function contentScriptWrapper() {
  while (true) {
    if (!currentURL || currentURL !== document.URL) {
      currentURL = document.URL;
      contentScriptRun();
    }

    await wait(1 * 1000);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", contentScriptWrapper);
} else {
  contentScriptWrapper();
}
