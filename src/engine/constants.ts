export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export const INSPECTION_WINDOW_DAYS = 7;
export const NO_SHIP_DAYS = 3;

export const VERIFICATION_FEE = 30; // PKR, flat per parcel
export const ADJUDICATION_FEE = 150; // PKR, published service charge (display only in demo)

export const BUYER_STARTING_BALANCE = 25_000;

export const USERS = {
  buyer: { id: "buyer-1", name: "Ayesha Khan", consumerId: "SP-C-88231" },
  seller: { id: "seller-1", name: "Faisal Traders (Shopping.pk)" },
  courier: { id: "courier-1", name: "TCS Express" },
  adminA: { id: "admin-a", name: "Sara (Adjudicator A)" },
  adminB: { id: "admin-b", name: "Hamza (Adjudicator B)" },
} as const;

// The backend's seeded identities (DemoSeed.java) — the stub-auth headers the
// API expects. Fixed UUIDs, identical every run.
export const BACKEND_IDS = {
  buyer: "00000000-0000-0000-0000-00000000b001",
  seller: "00000000-0000-0000-0000-00000000f001",
  courier: "00000000-0000-0000-0000-00000000c001",
  adminA: "00000000-0000-0000-0000-00000000ad01",
  adminB: "00000000-0000-0000-0000-00000000ad02",
  merchant: "00000000-0000-0000-0000-00000000e001",
} as const;

export interface CatalogProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number; // 0..5
  reviews: number;
  tag?: string;
}

// Prices deliberately span the Wakala fee tiers (25 / 75 / 200).
export const PRODUCTS: CatalogProduct[] = [
  { id: "sneakers", name: "Street Runner Sneakers", image: "/img/products/sneakers.jpg", price: 4_999, rating: 4.2, reviews: 318, tag: "Best seller" },
  { id: "headphones", name: "Studio Wireless Headphones", image: "/img/products/headphones.jpg", price: 18_999, rating: 4.7, reviews: 204 },
  { id: "watch", name: "Minimal Analog Watch", image: "/img/products/watch.jpg", price: 12_499, rating: 4.5, reviews: 141 },
  { id: "camera", name: "Instant Retro Camera", image: "/img/products/camera.jpg", price: 27_999, rating: 4.8, reviews: 96, tag: "New" },
  { id: "backpack", name: "Urban Canvas Backpack", image: "/img/products/backpack.jpg", price: 6_499, rating: 4.3, reviews: 267 },
  { id: "perfume", name: "Oud Noir Perfume 100ml", image: "/img/products/perfume.jpg", price: 8_999, rating: 4.6, reviews: 178 },
  { id: "sunglasses", name: "Aviator Sunglasses", image: "/img/products/sunglasses.jpg", price: 3_499, rating: 4.1, reviews: 322 },
  { id: "tee", name: "Essential Cotton Tee", image: "/img/products/tee.jpg", price: 1_899, rating: 4.4, reviews: 510 },
];

// Platform-correct webhook topics the simulation mirrors (Shopify topic names,
// WooCommerce webhook topics, and a plain custom-store event name).
export const WEBHOOK_TOPICS: Record<"payment" | "carts", Record<"shopify" | "woocommerce" | "custom", string>> = {
  payment: { shopify: "orders/paid", woocommerce: "order.created", custom: "payment.succeeded" },
  carts: { shopify: "checkouts/update", woocommerce: "cart.abandoned", custom: "cart.pending" },
};

export const WEBHOOK_EVENT_CAP = 20;

// Real backend chart-of-account codes (the ledger entries now come from the
// Java money core, so the codes match its accounts table).
export const ACCOUNTS = {
  buyerWallet: "buyer_wallet_pool",
  sellerWallet: "seller_wallet_pool",
  platformFee: "platform_fee",
  purification: "purification",
  escrow: (orderId: string) => `escrow:${orderId}`,
} as const;
