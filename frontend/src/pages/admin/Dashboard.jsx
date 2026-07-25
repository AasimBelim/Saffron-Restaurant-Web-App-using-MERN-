import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  DollarSign,
  Grid3X3,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import {
  formatCurrency,
  formatDateString,
  formatTimeString,
  formatTimestamp,
} from "../../utils/format";

const ORDER_STATUS_STYLES = {
  Pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  Preparing: "bg-blue-50 text-blue-700 ring-blue-200",
  Delivered: "bg-green-50 text-green-700 ring-green-200",
};

const BOOKING_STATUS_STYLES = {
  Pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  Approved: "bg-green-50 text-green-700 ring-green-200",
  Cancelled: "bg-red-50 text-red-700 ring-red-200",
};

const Dashboard = () => {
  const { axios, menus, categories } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, bookingsRes] = await Promise.all([
        axios.get("/api/order/orders"),
        axios.get("/api/booking/bookings"),
      ]);
      setOrders(ordersRes.data?.orders || []);
      setBookings(bookingsRes.data?.bookings || []);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Couldn't load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const stats = useMemo(() => {
    // only completed revenue counts; cancelled bookings are excluded from the count
    const revenue = orders
      .filter((order) => order.status === "Delivered")
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrders = orders.filter(
      (order) => order.status === "Pending"
    ).length;
    const pendingBookings = bookings.filter(
      (booking) => booking.status === "Pending"
    ).length;

    return [
      {
        label: "Revenue (delivered)",
        value: formatCurrency(revenue),
        icon: DollarSign,
        hint: `${orders.length} orders total`,
        to: "/admin/orders",
      },
      {
        label: "Orders",
        value: orders.length,
        icon: ShoppingCart,
        hint: `${pendingOrders} awaiting action`,
        to: "/admin/orders",
      },
      {
        label: "Bookings",
        value: bookings.length,
        icon: BookOpen,
        hint: `${pendingBookings} awaiting approval`,
        to: "/admin/bookings",
      },
      {
        label: "Menu items",
        value: menus.length,
        icon: UtensilsCrossed,
        hint: `across ${categories.length} categories`,
        to: "/admin/menus",
      },
    ];
  }, [orders, bookings, menus, categories]);

  const recentOrders = orders.slice(0, 5);
  const recentBookings = bookings.slice(0, 5);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Couldn&apos;t load the dashboard
        </h2>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <button
          type="button"
          onClick={loadStats}
          className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
                <div className="mt-4 h-7 w-24 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-100" />
              </div>
            ))
          : stats.map((stat) => (
              <Link
                key={stat.label}
                to={stat.to}
                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
                    <stat.icon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-yellow-500" />
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs text-gray-400">{stat.hint}</p>
              </Link>
            ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/add-menu"
          className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-500">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">Add a menu item</p>
            <p className="truncate text-sm text-gray-500">
              Publish a new dish to the menu
            </p>
          </div>
        </Link>
        <Link
          to="/admin/add-category"
          className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-900">
            <Grid3X3 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">Add a category</p>
            <p className="truncate text-sm text-gray-500">
              Group dishes for the menu page
            </p>
          </div>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Recent orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
            >
              View all
            </Link>
          </header>
          <div className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                No orders yet.
              </p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {order.user?.name || "Unknown customer"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimestamp(order.createdAt)} &middot;{" "}
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                      ORDER_STATUS_STYLES[order.status] ||
                      ORDER_STATUS_STYLES.Pending
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Recent bookings</h2>
            <Link
              to="/admin/bookings"
              className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
            >
              View all
            </Link>
          </header>
          <div className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
                </div>
              ))
            ) : recentBookings.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                No bookings yet.
              </p>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {booking.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateString(booking.date)} at{" "}
                      {formatTimeString(booking.time)} &middot;{" "}
                      {booking.numberOfPeople} guests
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                      BOOKING_STATUS_STYLES[booking.status] ||
                      BOOKING_STATUS_STYLES.Pending
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
