import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import {
  AlertCircle,
  ChefHat,
  Clock,
  CreditCard,
  LogIn,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { formatCurrency, formatTimestamp } from "../utils/format";

const STATUS_STYLES = {
  Pending: {
    badge: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    icon: Clock,
  },
  Preparing: {
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: ChefHat,
  },
  Delivered: {
    badge: "bg-green-50 text-green-700 ring-green-200",
    icon: Truck,
  },
};

const FILTERS = ["All", "Pending", "Preparing", "Delivered"];

const MyOrders = () => {
  const { axios, navigate } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [filter, setFilter] = useState("All");

  const fetchMyOrders = async () => {
    setLoading(true);
    setError(null);
    setNeedsAuth(false);
    try {
      const { data } = await axios.get("/api/order/my-orders");
      if (data.success) setOrders(data.orders || []);
      else setError(data.message || "Couldn't load your orders.");
    } catch (err) {
      if (err?.response?.status === 401) setNeedsAuth(true);
      else setError(err?.response?.data?.message || "Couldn't load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const counts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.All += 1;
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      { All: 0 }
    );
  }, [orders]);

  const visibleOrders = useMemo(
    () =>
      filter === "All"
        ? orders
        : orders.filter((order) => order.status === filter),
    [orders, filter]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-700">
            <Package className="h-3.5 w-3.5" />
            Order history
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            My <span className="text-yellow-500">Orders</span>
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Everything you&apos;ve ordered, with its current status.
          </p>
        </header>

        {/* Status filters */}
        {!loading && !error && !needsAuth && orders.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  filter === status
                    ? "bg-yellow-500 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-yellow-300 hover:text-yellow-600"
                }`}
              >
                {status}
                <span
                  className={
                    filter === status
                      ? "ml-1.5 text-white/80"
                      : "ml-1.5 text-gray-400"
                  }
                >
                  {counts[status] || 0}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
                    <div className="h-7 w-24 animate-pulse rounded-full bg-gray-100" />
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <div
                        key={j}
                        className="h-4 w-3/4 animate-pulse rounded bg-gray-100"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : needsAuth ? (
            <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <LogIn className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Sign in to see your orders
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Your order history is tied to your account.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate("/login", { state: { from: "/my-orders" } })
                }
                className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
              >
                Sign in
              </button>
            </div>
          ) : error ? (
            <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Couldn&apos;t load your orders
              </h2>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <button
                type="button"
                onClick={fetchMyOrders}
                className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
              >
                Try again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                No orders yet
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Once you place an order it will appear here.
              </p>
              <button
                type="button"
                onClick={() => navigate("/menu")}
                className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
              >
                Browse the menu
              </button>
            </div>
          ) : visibleOrders.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              No {filter.toLowerCase()} orders.
            </p>
          ) : (
            <div className="space-y-4">
              {visibleOrders.map((order) => {
                const statusStyle =
                  STATUS_STYLES[order.status] || STATUS_STYLES.Pending;
                const itemCount = order.items.reduce(
                  (sum, item) => sum + (item.quantity || 0),
                  0
                );
                return (
                  <article
                    key={order._id}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                          Order
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-sm text-gray-600">
                            #{order._id.slice(-6).toUpperCase()}
                          </span>
                        </h2>
                        <p className="mt-1 text-xs text-gray-400">
                          Placed on {formatTimestamp(order.createdAt)} &middot;{" "}
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyle.badge}`}
                      >
                        <statusStyle.icon className="h-3.5 w-3.5" />
                        {order.status}
                      </span>
                    </div>

                    {/* Ordered items — falls back to a count if the API didn't populate them */}
                    {order.items.some((item) => item.menuItem?.name) ? (
                      <ul className="mt-5 space-y-3 border-t border-gray-100 pt-5">
                        {order.items.map((item, index) => (
                          <li
                            key={item.menuItem?._id || index}
                            className="flex items-center gap-3"
                          >
                            {item.menuItem?.image ? (
                              <img
                                src={item.menuItem.image}
                                alt=""
                                loading="lazy"
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {item.menuItem?.name || "Item unavailable"}
                              </p>
                              <p className="text-xs text-gray-400">
                                Qty {item.quantity}
                                {item.menuItem?.price
                                  ? ` · ${formatCurrency(item.menuItem.price)} each`
                                  : ""}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-5 border-t border-gray-100 pt-5 text-sm text-gray-500">
                        {itemCount} {itemCount === 1 ? "item" : "items"} in this
                        order
                      </p>
                    )}

                    <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                        <div className="min-w-0">
                          <dt className="text-xs text-gray-400">
                            Delivery address
                          </dt>
                          <dd className="truncate text-sm font-medium text-gray-900">
                            {order.address}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                        <div className="min-w-0">
                          <dt className="text-xs text-gray-400">Payment</dt>
                          <dd className="truncate text-sm font-medium text-gray-900">
                            {order.paymentMethod}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 sm:justify-end">
                        <div className="sm:text-right">
                          <dt className="text-xs text-gray-400">Total</dt>
                          <dd className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
