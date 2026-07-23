import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, Check, ShieldCheck, ShoppingCart, Star } from "lucide-react";
import { useStore } from "../engine/store";
import { PRODUCT } from "../engine/constants";
import { formatPKR } from "../engine/fees";

export default function Bazaar() {
  const navigate = useNavigate();
  const { startCheckout, addToCart, activeCartId } = useStore();
  const [size, setSize] = useState<string>("42");
  const [codNote, setCodNote] = useState(false);
  const cartId = activeCartId ?? null;

  const draft = () => ({ productName: PRODUCT.name, productImage: PRODUCT.image, amount: PRODUCT.price, size });

  const paySukoon = () => {
    startCheckout({ ...draft(), cartId });
    navigate("/checkout");
  };

  const handleAddToCart = () => {
    if (cartId) return;
    addToCart(draft());
  };

  return (
    <div className="min-h-screen bg-orange-50/60">
      {/* Deliberately NOT Sukoon-branded — this is the partner store, showing the integration boundary */}
      <header className="bg-orange-600 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-black text-orange-600">B</span>
            <div>
              <p className="text-lg font-black tracking-tight">Bazaar.pk</p>
              <p className="-mt-1 text-[11px] text-orange-100">sab kuch, ghar tak</p>
            </div>
          </div>
          <ShoppingCart size={20} />
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-3xl border border-orange-200 bg-white p-10 text-[10rem] shadow-sm">
          {PRODUCT.image}
        </div>

        <div>
          <div className="mb-1 flex items-center gap-1 text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < 4 ? "currentColor" : "none"} />
            ))}
            <span className="ml-1 text-xs text-stone-400">4.2 · 318 ratings</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">{PRODUCT.name}</h1>
          <p className="mt-1 text-3xl font-black text-orange-600">{formatPKR(PRODUCT.price)}</p>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-stone-600">Size (EU)</p>
            <div className="flex gap-2">
              {PRODUCT.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`h-10 w-12 rounded-lg border text-sm font-bold transition ${
                    size === s ? "border-orange-500 bg-orange-500 text-white" : "border-stone-300 bg-white text-stone-600 hover:border-orange-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleAddToCart}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition ${
                cartId
                  ? "border-orange-300 bg-orange-100 text-orange-700"
                  : "border-orange-400 bg-white text-orange-600 hover:bg-orange-50"
              }`}
            >
              {cartId ? <Check size={16} /> : <ShoppingCart size={16} />}
              {cartId ? `Saved to cart (${cartId})` : "Add to cart"}
            </button>
            {cartId && (
              <p className="mt-1.5 text-center text-[11px] text-stone-400">
                In your cart. Leave the page and it becomes a pending cart in the seller&apos;s Sukoon Pay dashboard.
              </p>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-stone-600">Choose how to pay</p>

            <button
              onClick={() => setCodNote(true)}
              className="w-full rounded-xl border-2 border-stone-300 bg-white p-4 text-left transition hover:border-stone-400"
            >
              <div className="flex items-center gap-3">
                <Banknote className="text-stone-500" size={22} />
                <div>
                  <p className="font-bold text-stone-800">Cash on Delivery</p>
                  <p className="text-xs text-stone-500">Pay the rider in cash when the parcel arrives</p>
                </div>
              </div>
              {codNote && (
                <p className="mt-2 rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-500">
                  COD selected — the status quo. No protection if the item is defective, and the seller waits weeks for the
                  courier to settle the cash. There&apos;s a better way ↓
                </p>
              )}
            </button>

            <button
              onClick={paySukoon}
              className="w-full rounded-xl border-2 border-emerald-500 bg-emerald-600 p-4 text-left text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg font-bold text-emerald-600">س</span>
                <div>
                  <p className="font-bold">Pay with Sukoon Pay (Protected)</p>
                  <p className="text-xs text-emerald-100">Money held in escrow until you confirm delivery</p>
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-700/60 px-3 py-2 text-xs">
                <ShieldCheck size={14} /> Buyer Protection · money held until you confirm delivery · refund if it never arrives
                or arrives defective
              </p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
