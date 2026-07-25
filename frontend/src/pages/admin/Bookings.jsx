import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Clock,
  MessageSquare,
  Phone,
  Search,
  Users,
} from "lucide-react";
import {
  formatDateString,
  formatTimeString,
  formatTimestamp,
} from "../../utils/format";

const STATUSES = ["Pending", "Approved", "Cancelled"];

const STATUS_STYLES = {
  Pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  Approved: "bg-green-50 text-green-700 ring-green-200",
  Cancelled: "bg-red-50 text-red-700 ring-red-200",
};

const Bookings = () => {
  const { axios } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/booking/bookings");
      if (data.success) setBookings(data.bookings || []);
      else setError(data.message || "Couldn't load bookings.");
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    const previous = bookings;
    // optimistic update so the select doesn't snap back while the request runs
    setBookings((prev) =>
      prev.map((booking) =>
        booking._id === bookingId ? { ...booking, status: newStatus } : booking
      )
    );
    setUpdatingId(bookingId);
    try {
      const { data } = await axios.put(
        `/api/booking/update-status/${bookingId}`,
        { status: newStatus }
      );
      if (data.success) {
        toast.success(data.message);
      } else {
        setBookings(previous);
        toast.error(data.message);
      }
    } catch (err) {
      setBookings(previous);
      toast.error(
        err?.response?.data?.message || "Couldn't update the booking status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(
    () =>
      bookings.reduce(
        (acc, booking) => {
          acc.All += 1;
          acc[booking.status] = (acc[booking.status] || 0) + 1;
          return acc;
        },
        { All: 0 }
      ),
    [bookings]
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = filter === "All" || booking.status === filter;
      const matchesTerm =
        !term ||
        booking.name?.toLowerCase().includes(term) ||
        booking.phone?.toLowerCase().includes(term) ||
        booking.user?.email?.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [bookings, filter, query]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Couldn&apos;t load bookings
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
            placeholder="Search name, phone or email..."
            aria-label="Search bookings"
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
              <div className="mt-4 h-12 w-full animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <BookOpen className="h-6 w-6 text-gray-400" />
          </div>
          <h2 className="mt-4 font-semibold text-gray-900">No bookings yet</h2>
          <p className="mt-1 text-sm text-gray-500">
            Table reservations will appear here as they come in.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center text-sm text-gray-500">
          No bookings match your filters.
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((booking) => (
            <article
              key={booking._id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-gray-900">{booking.name}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                        STATUS_STYLES[booking.status] || STATUS_STYLES.Pending
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {booking.user?.email || "No account email"} &middot; booked{" "}
                    {formatTimestamp(booking.createdAt)}
                  </p>
                </div>

                <div>
                  <label className="sr-only" htmlFor={`status-${booking._id}`}>
                    Booking status
                  </label>
                  <select
                    id={`status-${booking._id}`}
                    value={booking.status}
                    onChange={(e) =>
                      handleStatusChange(booking._id, e.target.value)
                    }
                    disabled={updatingId === booking._id}
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
                      <a
                        href={`tel:${booking.phone?.replace(/[^\d+]/g, "")}`}
                        className="hover:text-yellow-600"
                      >
                        {booking.phone}
                      </a>
                    </dd>
                  </div>
                </div>
              </dl>

              {booking.note && (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <p className="text-sm text-gray-600">{booking.note}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;
