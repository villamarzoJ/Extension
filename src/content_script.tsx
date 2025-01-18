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
  for (let attempts = 0; attempts < 3; attempts++) {
    productPrice = await getProductPagePrice();

    if (productPrice == null) {
      console.log("price refresh?");
      await wait(2 * 1000);
      continue;
    }

    break;
  }

  if (productPrice == null) {
    return;
  }

  let userClick: UserClick = {
    platform: "lazada",
    eventTime: viewTime,
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

  for (let attempts = 0; attempts < 3; attempts++) {
    cartItems = document.querySelectorAll(
      `.checkout-shop-children .cart-item-inner`
    );

    if (cartItems.length !== 0) {
      break;
    }

    console.log("retrying to get cart elements...");
    await wait(2 * 1000);
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
          eventTime: cartRemoveTime,
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
        eventTime: cartAddTime,
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
          eventTime: purchaseTime,
          eventType: "cart",
          price: productPrice,
          userId: userID as UserID,
        };

        console.log("add purchase event");
        await addUserClick(userClick);
      }
    });
  }
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
    // TODO
    return;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", contentScriptRun);
} else {
  contentScriptRun();
}
