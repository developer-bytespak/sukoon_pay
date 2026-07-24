import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Minus, Plus, ShieldCheck, ShoppingCart, Star, Trash2, X } from "lucide-react";
import { useStore } from "../engine/store";
import type { CatalogProduct } from "../engine/constants";
import { PRODUCTS } from "../engine/constants";
import { formatPKR } from "../engine/fees";

function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={12} fill={i < Math.round(rating) ? "currentColor" : "none"} />
      ))}
      <span className="ml-1 text-[11px] text-stone-400">
        {rating.toFixed(1)} · {reviews}
      </span>
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const { cart, addToCart, updateCartQty } = useStore();
  const inCart = cart.items.find((i) => i.id === product.id);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {product.tag && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-orange-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
            {product.tag}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="text-sm font-bold text-stone-800">{product.name}</h3>
        <div className="mt-1">
          <Stars rating={product.rating} reviews={product.reviews} />
        </div>
        <p className="mt-1.5 text-lg font-black text-orange-600">{formatPKR(product.price)}</p>
        <div className="mt-auto pt-3">
          {inCart ? (
            <div className="flex items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-50 px-2 py-1.5">
              <button
                onClick={() => updateCartQty(product.id, -1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm transition hover:bg-orange-100"
                aria-label={`Remove one ${product.name}`}
              >
                <Minus size={14} />
              </button>
              <span className="text-sm font-bold text-orange-700">{inCart.qty} in cart</span>
              <button
                onClick={() => addToCart(product)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm transition hover:bg-orange-100"
                aria-label={`Add one more ${product.name}`}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              data-testid={`add-${product.id}`}
              onClick={() => addToCart(product)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-600 py-2 text-sm font-bold text-white transition hover:bg-orange-500"
            >
              <ShoppingCart size={14} /> Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { cart, updateCartQty, removeFromCart, startCheckout } = useStore();
  const [codNote, setCodNote] = useState(false);
  const total = cart.items.reduce((sum, i) => sum + i.qty * i.price, 0);

  const paySukoon = () => {
    startCheckout({ items: cart.items, amount: total, cartId: cart.id });
    onClose();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.aside
            data-testid="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-black text-stone-900">
                <ShoppingCart size={18} className="text-orange-600" /> Your cart
              </h2>
              <button onClick={onClose} className="text-stone-400 transition hover:text-stone-700" aria-label="Close cart">
                <X size={20} />
              </button>
            </div>

            {cart.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-stone-400">
                <ShoppingCart size={36} className="text-stone-200" />
                <p className="text-sm">Your cart is empty.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {cart.items.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 border-b border-stone-100 py-3 last:border-0">
                      <img src={i.image} alt={i.name} className="h-14 w-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-stone-800">{i.name}</p>
                        <p className="text-xs text-stone-400">{formatPKR(i.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQty(i.id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:bg-stone-100"
                          aria-label={`Decrease ${i.name} quantity`}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-stone-800">{i.qty}</span>
                        <button
                          onClick={() => updateCartQty(i.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:bg-stone-100"
                          aria-label={`Increase ${i.name} quantity`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(i.id)}
                        className="text-stone-300 transition hover:text-rose-500"
                        aria-label={`Remove ${i.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200 px-5 py-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-stone-500">Subtotal</span>
                    <span className="text-xl font-black text-stone-900">{formatPKR(total)}</span>
                  </div>

                  <button
                    data-testid="pay-sukoon"
                    onClick={paySukoon}
                    className="w-full rounded-xl border-2 border-emerald-500 bg-emerald-600 p-3.5 text-left text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-base font-bold text-emerald-600">س</span>
                      <span>
                        <span className="block text-sm font-bold">Pay with Sukoon Pay (Protected)</span>
                        <span className="block text-[11px] text-emerald-100">Money held in escrow until you confirm delivery</span>
                      </span>
                    </span>
                  </button>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-700">
                    <ShieldCheck size={12} /> Refund if it never arrives or arrives defective
                  </p>

                  <button
                    onClick={() => setCodNote(true)}
                    className="mt-2.5 flex w-full items-center gap-2.5 rounded-xl border-2 border-stone-200 bg-white p-3 text-left transition hover:border-stone-300"
                  >
                    <Banknote className="text-stone-500" size={20} />
                    <span>
                      <span className="block text-sm font-bold text-stone-700">Cash on Delivery</span>
                      <span className="block text-[11px] text-stone-400">Pay the rider in cash when it arrives</span>
                    </span>
                  </button>
                  {codNote && (
                    <p className="mt-1.5 rounded-lg bg-stone-100 px-3 py-2 text-[11px] text-stone-500">
                      COD selected: the status quo. No protection if the item is defective, and the seller waits weeks for
                      the courier to settle the cash. The protected option above fixes both.
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Store() {
  const cart = useStore((s) => s.cart);
  const [cartOpen, setCartOpen] = useState(false);
  const count = cart.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="min-h-screen bg-orange-50/60">
      {/* Deliberately NOT Sukoon-branded — this is the partner store, showing the integration boundary */}
      <header className="sticky top-0 z-30 bg-orange-600 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-black text-orange-600">S</span>
            <div>
              <p className="text-lg font-black leading-tight tracking-tight">Shopping.pk</p>
              <p className="-mt-0.5 text-[11px] text-orange-100">sab kuch, ghar tak</p>
            </div>
          </div>
          <button
            data-testid="cart-button"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-xl bg-orange-700/60 px-3.5 py-2 text-sm font-bold transition hover:bg-orange-700"
          >
            <ShoppingCart size={18} />
            Cart
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-black text-orange-600">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="bg-emerald-600/95 text-white">
        <p className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold">
          <ShieldCheck size={12} /> Buyer Protection by Sukoon Pay · money held in trust until you confirm delivery
        </p>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-2xl font-black text-stone-900">Featured products</h1>
          <p className="text-xs text-stone-400">{PRODUCTS.length} items · ships nationwide with TCS</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </main>

      <footer className="border-t border-orange-100 py-5 text-center text-[11px] text-stone-400">
        Shopping.pk · demo storefront · payments protected by Sukoon Pay
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
