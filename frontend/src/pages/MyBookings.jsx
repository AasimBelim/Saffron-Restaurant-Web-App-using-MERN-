import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  LogIn,
  MessageSquare,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import {
  formatDateString,
  formatTimeString,
  formatTimestamp,
} from "../utils/format";

const STATUS_STYLES = {
  Pending: {
    badge: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    icon: Clock,
  },
  Approved: {
    badge: "bg-green-50 text-green-700 ring-green-200",
    icon: CheckCircle2,
  },
  Cancelled: {
    badge: "bg-red-50 text-red-700 ring-red-200",
    icon: XCircle,
  },
};

const FILTERS = ["All", "Pending", "Approved", "Cancelled"];

const MyBookings = () => {
  const { axios, navigate } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [filter, setFilter] = useState("All");

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    setNeedsAuth(false);
    try {
      const { data } = await axios.get("/api/booking/my-bookings");
      if (data.success) setBookings(data.bookings || []);
      else setError(data.message || "Couldn't load your bookings.");
    } catch (err) {
      if (err?.response?.status === 401) setNeedsAuth(true);
      else
        setError(
          err?.response?.data?.message || "Couldn't load your bookings."
        );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const counts = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        acc.All += 1;
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      },
      { All: 0 }
    );
  }, [bookings]);

  const visibleBookings = useMemo(
    () =>
      filter === "All"
        ? bookings
        : bookings.filter((booking) => booking.status === filter),
    [bookings, filter]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-700">
            <CalendarDays className="h-3.5 w-3.5" />
            Reservations
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            My <span className="text-yellow-500">Bookings</span>
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Track the status of every table you&apos;ve reserved with us.
          </p>
        </header>

        {/* Status filters */}
        {!loading && !error && !needsAuth && bookings.length > 0 && (
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
                    filter === status ? "ml-1.5 text-white/80" : "ml-1.5 text-gray-400"
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
                Sign in to see your bookings
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Your reservations are tied to your account.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate("/login", { state: { from: "/my-bookings" } })
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
                Couldn&apos;t load your bookings
              </h2>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <button
                type="button"
                onClick={fetchBookings}
                className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
              >
                Try again
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <CalendarDays className="h-6 w-6 text-gray-400" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                No bookings yet
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Reserve a table and it will show up here.
              </p>
              <button
                type="button"
                onClick={() => navigate("/book-table")}
                className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
              >
                Book a table
              </button>
            </div>
          ) : visibleBookings.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              No {filter.toLowerCase()} bookings.
            </p>
          ) : (
            <div className="space-y-4">
              {visibleBookings.map((booking) => {
                const statusStyle =
                  STATUS_STYLES[booking.status] || STATUS_STYLES.Pending;
                return (
                  <article
                    key={booking._id}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {booking.name}
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Booked on {formatTimestamp(booking.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyle.badge}`}
                      >
                        <statusStyle.icon className="h-3.5 w-3.5" />
                        {booking.status}
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-start gap-3">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                        <div>
                          <dt className="text-xs text-gray-400">Date</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {formatDateString(booking.date)}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                        <div>
                          <dt className="text-xs text-gray-400">Time</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {formatTimeString(booking.time)}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                        <div>
                          <dt className="text-xs text-gray-400">Guests</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {booking.numberOfPeople}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                        <div className="min-w-0">
                          <dt className="text-xs text-gray-400">Phone</dt>
                          <dd className="truncate text-sm font-medium text-gray-900">
                            {booking.phone}
                          </dd>
                        </div>
                      </div>
                    </dl>

                    {booking.note && (
                      <div className="mt-5 flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3">
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <p className="text-sm text-gray-600">{booking.note}</p>
                      </div>
                    )}
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

export default MyBookings;
