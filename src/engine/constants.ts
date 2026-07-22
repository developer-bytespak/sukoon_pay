export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export const INSPECTION_WINDOW_DAYS = 7;
export const NO_SHIP_DAYS = 3;

export const VERIFICATION_FEE = 30; // PKR, flat per parcel
export const ADJUDICATION_FEE = 150; // PKR, published service charge (display only in demo)

export const BUYER_STARTING_BALANCE = 25_000;

export const USERS = {
  buyer: { id: "buyer-1", name: "Ayesha Khan", consumerId: "SP-C-88231" },
  seller: { id: "seller-1", name: "Faisal Traders (Bazaar.pk)" },
  courier: { id: "courier-1", name: "TCS Express" },
  adminA: { id: "admin-a", name: "Sara (Adjudicator A)" },
  adminB: { id: "admin-b", name: "Hamza (Adjudicator B)" },
} as const;

export const PRODUCT = {
  name: "Street Runner Sneakers",
  image: "👟",
  price: 4_999,
  sizes: ["40", "41", "42", "43", "44"],
} as const;

export const ACCOUNTS = {
  buyerWallet: "buyer_wallet",
  sellerWallet: "seller_wallet",
  platformFee: "platform_fee",
  purification: "purification",
  escrow: (orderId: string) => `escrow:${orderId}`,
} as const;
