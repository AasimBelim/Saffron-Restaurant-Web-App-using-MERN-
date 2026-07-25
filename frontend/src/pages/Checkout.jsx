import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  LogIn,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "../utils/format";

const DRAFT_KEY = "checkout:delivery";

const PAYMENT_OPTIONS = [
  {
    value: "Pay at hotel",
    label: "Pay at hotel",
    description: "Settle the bill in cash or by card when your order arrives.",
    icon: Banknote,
  },
  {
    value: "Online Payment",
    label: "Online payment",
    description: "Pay upfront — you'll be prompted once the order is placed.",
    icon: CreditCard,
  },
];

const EMPTY_FORM = {
  name: "",
  phone: "",
  street: "",
  city: "",
  pincode: "",
  landmark: "",
  notes: "",
};

// the backend stores the address as a single string, so the structured fields
// are collapsed into one readable line before the order is sent
const composeAddress = ({ name, phone, street, city, pincode, landmark, notes }) =>
  [
    `${street.trim()}, ${city.trim()} ${pincode.trim()}`.trim(),
    landmark.trim() && `Near ${landmark.trim()}`,
    `${name.trim()} · ${phone.trim()}`,
    notes.trim() && `Note: ${notes.trim()}`,
  ]
    .filter(Boolean)
    .join(" — ");

const validate = (form) => {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Enter the name for this delivery.";
  const digits = form.phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15)
    errors.phone = "Enter a valid phone number we can reach you on.";
  if (form.street.trim().length < 5)
    errors.street = "Enter the house/flat number and street.";
  if (!form.city.trim()) errors.city = "Enter your city.";
  if (!/^[A-Za-z0-9\s-]{4,10}$/.test(form.pincode.trim()))
    errors.pincode = "Enter a valid postcode.";
  return errors;
};

const Field = ({
  id,
  label,
  error,
  hint,
  className = "",
  as = "input",
  ...props
}) => {
  const Tag = as;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <Tag
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-200"
            : "border-gray-200 focus:border-yellow-400 focus:ring-yellow-200"
        } ${as === "textarea" ? "resize-none" : ""}`}
        {...props}
      />
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

const Checkout = () => {
  const { totalPrice, cart, user, authChecked, axios, navigate, fetchCartData } =
    useContext(AppContext);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("Pay at hotel");
  const [placing, setPlacing] = useState(false);

  // reuse the last delivery details so a returning customer only has to confirm
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (saved) setForm((prev) => ({ ...prev, ...saved, notes: "" }));
    } catch {
      // a corrupt draft is not worth surfacing — fall back to an empty form
    }
  }, []);

  // prefill the recipient from the signed-in account, unless a draft filled it
  useEffect(() => {
    if (!user?.name) return;
    setForm((prev) => (prev.name ? prev : { ...prev, name: user.name }));
  }, [user?.name]);

  const lines = useMemo(
    () =>
      (cart?.items || []).map((item) => {
        const menu = item.menuItem;
        return {
          key: item._id || menu?._id,
          name: menu?.name || "Item no longer available",
          image: menu?.image,
          quantity: item.quantity,
          lineTotal: (Number(menu?.price) || 0) * item.quantity,
        };
      }),
    [cart]
  );

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const setField = (key) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [key]: value }));
    // once a field has been corrected, clear its error as the user types
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleBlur = (key) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const fieldErrors = validate(form);
    setErrors((prev) => ({ ...prev, [key]: fieldErrors[key] }));
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (placing) return;

    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setTouched(
        Object.keys(EMPTY_FORM).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      );
      toast.error("Please complete the delivery details.");
      document
        .getElementById(Object.keys(fieldErrors)[0])
        ?.focus({ preventScroll: false });
      return;
    }

    setPlacing(true);
    try {
      const { data } = await axios.post("/api/order/place", {
        address: composeAddress(form),
        paymentMethod,
      });
      if (!data.success) {
        toast.error(data.message || "Couldn't place your order.");
        return;
      }
      try {
        // the note belongs to this order only — everything else is worth reusing
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, notes: "" }));
      } catch {
        // storage can be unavailable in private mode — the order still went through
      }
      // the server empties the cart on success, so re-sync or the navbar badge
      // keeps showing the items that were just ordered
      await fetchCartData();
      toast.success(data.message || "Order placed successfully");
      navigate("/my-orders");
    } catch (error) {
      console.error("Place order error:", error);
      if (error?.response?.status === 401) {
        toast.error("Your session expired. Please sign in again.");
        navigate("/login", { state: { from: "/checkout" } });
        return;
      }
      toast.error(
        error?.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setPlacing(false);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-700">
            <Lock className="h-3.5 w-3.5" />
            Secure checkout
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Complete your <span className="text-yellow-500">order</span>
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Tell us where it&apos;s going and how you&apos;d like to pay.
          </p>

          {/* progress trail */}
          <ol className="mx-auto mt-8 flex max-w-md items-center text-xs font-semibold">
            {["Cart", "Details", "Confirmation"].map((step, index) => {
              const done = index === 0;
              const active = index === 1;
              return (
                <li
                  key={step}
                  className={`flex items-center ${index < 2 ? "flex-1" : ""}`}
                >
                  <span
                    className={`flex items-center gap-2 ${
                      active
                        ? "text-gray-900"
                        : done
                        ? "text-yellow-600"
                        : "text-gray-400"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                        active
                          ? "bg-yellow-500 text-white"
                          : done
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    {step}
                  </span>
                  {index < 2 && (
                    <span
                      className={`mx-3 h-px flex-1 ${
                        done ? "bg-yellow-300" : "bg-gray-200"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </header>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );

  if (!authChecked) {
    return shell(
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />
          <div className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />
      </div>
    );
  }

  if (!user) {
    return shell(
      <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <LogIn className="h-6 w-6 text-yellow-600" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Sign in to place your order
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          We keep your cart and delivery details tied to your account.
        </p>
        <button
          type="button"
          onClick={() => navigate("/login", { state: { from: "/checkout" } })}
          className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
        >
          Sign in
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
          There&apos;s nothing to check out
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Add a few dishes to your cart and come back to finish your order.
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
    <form
      onSubmit={placeOrder}
      noValidate
      className="grid items-start gap-6 lg:grid-cols-3"
    >
      <div className="space-y-6 lg:col-span-2">
        {/* Delivery details */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Delivery details
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Our rider will use this to find you.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field
              id="name"
              label="Full name"
              placeholder="Jane Cooper"
              autoComplete="name"
              value={form.name}
              onChange={setField("name")}
              onBlur={handleBlur("name")}
              error={touched.name ? errors.name : undefined}
            />
            <Field
              id="phone"
              label="Phone number"
              type="tel"
              inputMode="tel"
              placeholder="+1 555 018 2244"
              autoComplete="tel"
              value={form.phone}
              onChange={setField("phone")}
              onBlur={handleBlur("phone")}
              error={touched.phone ? errors.phone : undefined}
              hint="Used only for delivery updates."
            />
            <Field
              id="street"
              as="textarea"
              rows={3}
              label="Street address"
              placeholder="Flat 12B, 221 Baker Street"
              autoComplete="street-address"
              className="sm:col-span-2"
              value={form.street}
              onChange={setField("street")}
              onBlur={handleBlur("street")}
              error={touched.street ? errors.street : undefined}
            />
            <Field
              id="city"
              label="City"
              placeholder="London"
              autoComplete="address-level2"
              value={form.city}
              onChange={setField("city")}
              onBlur={handleBlur("city")}
              error={touched.city ? errors.city : undefined}
            />
            <Field
              id="pincode"
              label="Postcode"
              placeholder="NW1 6XE"
              autoComplete="postal-code"
              value={form.pincode}
              onChange={setField("pincode")}
              onBlur={handleBlur("pincode")}
              error={touched.pincode ? errors.pincode : undefined}
            />
            <Field
              id="landmark"
              label="Landmark"
              placeholder="Opposite the central library"
              className="sm:col-span-2"
              value={form.landmark}
              onChange={setField("landmark")}
              hint="Optional — anything that makes the address easier to find."
            />
            <Field
              id="notes"
              as="textarea"
              rows={2}
              label="Delivery notes"
              placeholder="Ring the bell twice, leave at the door…"
              maxLength={200}
              className="sm:col-span-2"
              value={form.notes}
              onChange={setField("notes")}
              hint={`Optional — ${200 - form.notes.length} characters left.`}
            />
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Payment method</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Choose how you&apos;d like to settle the bill.
              </p>
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="sr-only">Payment method</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {PAYMENT_OPTIONS.map((option) => {
                const selected = paymentMethod === option.value;
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                      selected
                        ? "border-yellow-400 bg-yellow-50/60 shadow-sm ring-1 ring-yellow-300"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={selected}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="peer sr-only"
                    />
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                        {option.description}
                      </span>
                    </span>
                    {selected && (
                      <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-yellow-500" />
                    )}
                    <span className="pointer-events-none absolute inset-0 rounded-2xl peer-focus-visible:ring-2 peer-focus-visible:ring-yellow-500 peer-focus-visible:ring-offset-2" />
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-yellow-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </button>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-gray-900">Order summary</h2>
            <span className="text-xs font-medium text-gray-400">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>

          <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto border-t border-gray-100 pt-5">
            {lines.map((line) => (
              <li key={line.key} className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {line.image ? (
                    <img
                      src={line.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <UtensilsCrossed className="h-5 w-5 text-gray-400" />
                    </span>
                  )}
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
                    {line.quantity}
                  </span>
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                  {line.name}
                </p>
                <p className="text-sm font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(line.lineTotal)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-3 border-t border-gray-100 pt-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-semibold text-gray-900 tabular-nums">
                {formatCurrency(totalPrice)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-gray-500">
                <Truck className="h-4 w-4" />
                Delivery
              </dt>
              <dd className="font-semibold text-green-600">Free</dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-gray-100 pt-5">
            <span className="text-base font-semibold text-gray-900">
              Total to pay
            </span>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(totalPrice)}
            </span>
          </div>

          <button
            type="submit"
            disabled={placing}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-yellow-600 hover:shadow-md active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            {placing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Placing your order…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Place order · {formatCurrency(totalPrice)}
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
            By placing this order you agree to our terms of service.
          </p>

          <ul className="mt-5 space-y-2 border-t border-gray-100 pt-5 text-xs text-gray-500">
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 shrink-0 text-green-500" />
              Freshly cooked to order
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-green-500" />
              Your details stay private
            </li>
          </ul>
        </div>
      </aside>
    </form>
  );
};

export default Checkout;