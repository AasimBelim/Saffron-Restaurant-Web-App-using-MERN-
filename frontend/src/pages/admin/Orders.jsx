import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import { AlertCircle, MapPin, Package, Search } from "lucide-react";
import { formatCurrency, formatTimestamp } from "../../utils/format";

const STATUSES = ["Pending", "Preparing", "Delivered"];

const STATUS_STYLES = {
  Pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  Preparing: "bg-blue-50 text-blue-700 ring-blue-200",
  Delivered: "bg-green-50 text-green-700 ring-green-200",
};

const Orders = () => {
  const { axios } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/order/orders");
      if (data.success) setOrders(data.orders || []);
      else setError(data.message || "Couldn't load orders.");
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const previous = orders;
    // optimistic update so the select doesn't snap back while the request runs
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId ? { ...order, status: newStatus } : order
      )
    );
    setUpdatingId(orderId);
    try {
      const { data } = await axios.put(`/api/order/update-status/${orderId}`, {
        status: newStatus,
      });
      if (data.success) {
        toast.success(data.message);
      } else {
        setOrders(previous);
        toast.error(data.message);
      }
    } catch (err) {
      setOrders(previous);
      toast.error(
        err?.response?.data?.message || "Couldn't update the order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(
    () =>
      orders.reduce(
        (acc, order) => {
          acc.All += 1;
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        },
        { All: 0 }
      ),
    [orders]
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = filter === "All" || order.status === filter;
      const matchesTerm =
        !term ||
        order.user?.name?.toLowerCase().includes(term) ||
        order.user?.email?.toLowerCase().includes(term) ||
        order.address?.toLowerCase().includes(term) ||
        order._id?.slice(-6).toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [orders, filter, query]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Couldn&apos;t load orders
        </h2>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <button
          type="button"
          onClick={fetchOrders}
          className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", ...STATUSES].map((status) => (
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

        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, address or ID..."
            aria-label="Search orders"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/15"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-16 w-full animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-6 w-6 text-gray-400" />
          </div>
          <h2 className="mt-4 font-semibold text-gray-900">No orders yet</h2>
          <p className="mt-1 text-sm text-gray-500">
            Orders placed by customers will appear here.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center text-sm text-gray-500">
          No orders match your filters.
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <article
              key={order._id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-gray-900">
                      {order.user?.name || "Unknown customer"}
                    </h2>
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                        STATUS_STYLES[order.status] || STATUS_STYLES.Pending
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {order.user?.email || "No email"} &middot;{" "}
                    {formatTimestamp(order.createdAt)} &middot;{" "}
                    {order.paymentMethod}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <label className="sr-only" htmlFor={`status-${order._id}`}>
                    Order status
                  </label>
                  <select
                    id={`status-${order._id}`}
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    disabled={updatingId === order._id}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/15 disabled:opacity-60"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                <span>{order.address}</span>
              </div>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {order.items.map((line, index) => (
                  <li
                    key={line.menuItem?._id || index}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
                  >
                    {line.menuItem?.image ? (
                      <img
                        src={line.menuItem.image}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-200">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {line.menuItem?.name || "Item removed"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Qty {line.quantity}
                        {line.menuItem?.price
                          ? ` · ${formatCurrency(line.menuItem.price)} each`
                          : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
