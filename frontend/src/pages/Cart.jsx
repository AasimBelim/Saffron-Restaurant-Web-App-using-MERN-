import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  LogIn,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "../utils/format";

// the backend has no "set quantity" endpoint — /api/cart/add does `quantity +=`,
// so a delta of -1 decrements. Dropping to zero removes the line instead.
const MAX_QTY = 20;

const ItemImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100">
        <UtensilsCrossed className="h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};

const Cart = () => {
  const { cart, navigate, axios, fetchCartData } = useContext(AppContext);

  // rendered from local state so quantity changes feel instant; the context
  // cart stays the source of truth and re-syncs once the request lands
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | auth | error
  const [busyId, setBusyId] = useState(null);
  const pending = useRef(0);

  const loadCart = async () => {
    setStatus("loading");
    try {
      const { data } = await axios.get("/api/cart/get");
      // an empty cart comes back as `{ items: [] }` with no `success` flag
      setItems(data.cart?.items || data.items || []);
      setStatus("ready");
    } catch (err) {
      if (err?.response?.status === 401) setStatus("auth");
      else setStatus("error");
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  // pick up changes made elsewhere (e.g. "Add" on the menu page) without
  // clobbering an optimistic update that is still in flight
  useEffect(() => {
    if (status !== "ready" || pending.current > 0) return;
    if (cart?.items) setItems(cart.items);
  }, [cart, status]);

  const lines = useMemo(
    () =>
      items.map((item) => {
        const menu = item.menuItem;
        const price = Number(menu?.price) || 0;
        return {
          key: item._id || menu?._id,
          menuId: menu?._id,
          name: menu?.name,
          image: menu?.image,
          price,
          quantity: item.quantity,
          lineTotal: price * item.quantity,
          // a menu item deleted by an admin populates as null
          missing: !menu,
          unavailable: menu ? menu.isAvailable === false : true,
        };
      }),
    [items]
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => (line.missing ? sum : sum + line.lineTotal), 0),
    [lines]
  );
  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines]
  );
  const blockedLines = lines.filter((line) => line.unavailable);

  // `delta` of -1 on a single-quantity line removes it, matching what shoppers expect
  const changeQuantity = async (line, delta) => {
    if (busyId || !line.menuId) return;
    const next = line.quantity + delta;
    if (next < 1) return removeItem(line);
    if (next > MAX_QTY) return;

    setBusyId(line.menuId);
    pending.current += 1;
    const snapshot = items;
    setItems((prev) =>
      prev.map((item) =>
        item.menuItem?._id === line.menuId
          ? { ...item, quantity: next }
          : item
      )
    );

    try {
      const { data } = await axios.post("/api/cart/add", {
        menuId: line.menuId,
        quantity: delta,
      });
      if (!data.success) throw new Error(data.message);
      await fetchCartData();
    } catch (err) {
      setItems(snapshot);
      toast.error(
        err?.response?.data?.message || "Couldn't update the quantity."
      );
    } finally {
      pending.current -= 1;
      setBusyId(null);
    }
  };

  const removeItem = async (line) => {
    if (busyId || !line.menuId) return;
    setBusyId(line.menuId);
    pending.current += 1;
    const snapshot = items;
    setItems((prev) => prev.filter((item) => item.menuItem?._id !== line.menuId));

    try {
      const { data } = await axios.delete(`/api/cart/remove/${line.menuId}`);
      if (!data.success) throw new Error(data.message);
      toast.success(`${line.name || "Item"} removed from your cart`);
      await fetchCartData();
    } catch (err) {
      setItems(snapshot);
      toast.error(err?.response?.data?.message || "Couldn't remove the item.");
    } finally {
      pending.current -= 1;
      setBusyId(null);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-700">
            <ShoppingBag className="h-3.5 w-3.5" />
            Your cart
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Shopping <span className="text-yellow-500">Cart</span>
          </h1>
          <p className="mt-3 text-base text-gray-500">
            {status === "ready" && itemCount > 0
              ? `${itemCount} ${itemCount === 1 ? "item" : "items"} ready to be ordered.`
              : "Review your items before you check out."}
          </p>
        </header>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );

  if (status === "loading") {
    return shell(
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-2/5 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-10 w-28 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />
      </div>
    );
  }

  if (status === "auth") {
    return shell(
      <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <LogIn className="h-6 w-6 text-yellow-600" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Sign in to see your cart
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Your cart is saved to your account, so it follows you across devices.
        </p>
        <button
          type="button"
          onClick={() => navigate("/login", { state: { from: "/cart" } })}
          className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (status === "error") {
    return shell(
      <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Couldn&apos;t load your cart
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={loadCart}
          className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
        >
          Try again
        </button>
      </div>
    );
  }

  if (lines.length === 0) {
    return shell(
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <ShoppingBag className="h-6 w-6 text-gray-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Your cart is empty
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Browse the menu and add something you&apos;ll enjoy.
        </p>
        <button
          type="button"
          onClick={() => navigate("/menu")}
          className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
        >
          Browse the menu
        </button>
      </div>
    );
  }

  return shell(
    <div className="grid items-start gap-6 lg:grid-cols-3">
      {/* Items */}
      <section className="lg:col-span-2" aria-label="Cart items">
        <ul className="space-y-4">
          {lines.map((line) => {
            const busy = busyId === line.menuId;
            return (
              <li
                key={line.key}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 ${
                  line.unavailable
                    ? "border-red-100"
                    : "border-gray-100 hover:shadow-md"
                } ${busy ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
                  <ItemImage src={line.image} alt={line.name || ""} />

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-gray-900">
                      {line.name || "Item no longer available"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatCurrency(line.price)} each
                    </p>
                    {line.unavailable && (
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Currently unavailable
                      </span>
                    )}
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">
                    <button
                      type="button"
                      onClick={() => changeQuantity(line, -1)}
                      disabled={busy || line.missing}
                      aria-label={`Decrease quantity of ${line.name || "item"}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-white hover:text-yellow-600 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span
                      aria-live="polite"
                      className="w-9 text-center text-sm font-semibold text-gray-900 tabular-nums"
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(line, 1)}
                      disabled={busy || line.missing || line.quantity >= MAX_QTY}
                      aria-label={`Increase quantity of ${line.name || "item"}`}
                      title={
                        line.quantity >= MAX_QTY
                          ? `Maximum ${MAX_QTY} per item`
                          : undefined
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-white hover:text-yellow-600 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="w-24 text-right text-base font-bold text-gray-900 tabular-nums">
                    {formatCurrency(line.lineTotal)}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(line)}
                    disabled={busy || line.missing}
                    aria-label={`Remove ${line.name || "item"} from cart`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => navigate("/menu")}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-yellow-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </button>
      </section>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Order summary</h2>

          <dl className="mt-5 space-y-3 border-t border-gray-100 pt-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
              </dt>
              <dd className="font-semibold text-gray-900 tabular-nums">
                {formatCurrency(subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Delivery</dt>
              <dd className="text-gray-500">Calculated at checkout</dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-gray-100 pt-5">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {blockedLines.length > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Remove the unavailable{" "}
              {blockedLines.length === 1 ? "item" : "items"} to continue to
              checkout.
            </p>
          )}

          <button
            type="button"
            onClick={() => navigate("/checkout")}
            disabled={blockedLines.length > 0}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-yellow-600 hover:shadow-md active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            Proceed to checkout
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pay at the hotel or online — your choice at checkout.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default Cart;
