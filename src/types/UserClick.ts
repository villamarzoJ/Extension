type UserClick = {
  platform: PlatformEnum;

  eventTime: Date;
  eventType: EventEnum;
  categoryCode?: string;
  categoryId?: string;
  productID?: string; // TODO: a bit difficult to do
  brand?: string;
  price: Price;
  userId: UserID;
  sessionId?: string;
};

type Price = {
  currency: string;
  value: number;
};

type EventEnum = "view" | "cart" | "remove_from_cart" | "purchase";
type PlatformEnum = "lazada" | "shopee";

type UserID = string;
function generateUserID(): UserID {
  return Math.floor(Math.random() * 100_000).toString();
}

export { UserClick, UserID, Price, EventEnum, PlatformEnum, generateUserID };
