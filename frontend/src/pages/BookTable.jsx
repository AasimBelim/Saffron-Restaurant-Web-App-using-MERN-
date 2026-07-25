import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock,
  Mail,
  Minus,
  // MapPin is used by the address line in the sidebar — re-import when uncommented.
  Phone,
  Plus,
  User,
  Users,
} from "lucide-react";

// 30-minute slots across service hours, stored as the "HH:MM" strings the API expects
const buildTimeSlots = () => {
  const slots = [];
  for (let minutes = 11 * 60; minutes <= 22 * 60; minutes += 30) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }
  return slots;
};

const TIME_SLOTS = buildTimeSlots();
const MAX_GUESTS = 20;

const formatSlotLabel = (slot) => {
  const [hour, minute] = slot.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const toInputDate = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const BookTable = () => {
  const { axios, navigate, user } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    numberOfPeople: 2,
    date: "",
    time: "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const today = useMemo(() => toInputDate(new Date()), []);
  const maxDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return toInputDate(date);
  }, []);

  // prefill contact details once the signed-in user resolves
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.name || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const handleChange = (e) => setField(e.target.name, e.target.value);

  const changeGuests = (delta) => {
    setField(
      "numberOfPeople",
      Math.min(MAX_GUESTS, Math.max(1, Number(formData.numberOfPeople) + delta))
    );
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) nextErrors.name = "Please enter your name";
    else if (formData.name.trim().length < 2)
      nextErrors.name = "Name looks too short";

    if (!formData.email.trim()) nextErrors.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim()))
      nextErrors.email = "Enter a valid email address";

    const digits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) nextErrors.phone = "Please enter your phone number";
    else if (digits.length < 10 || digits.length > 15)
      nextErrors.phone = "Enter a valid phone number";

    const guests = Number(formData.numberOfPeople);
    if (!guests || guests < 1) nextErrors.numberOfPeople = "At least 1 guest";
    else if (guests > MAX_GUESTS)
      nextErrors.numberOfPeople = `For parties over ${MAX_GUESTS}, please call us`;

    if (!formData.date) nextErrors.date = "Pick a date";
    else if (formData.date < today) nextErrors.date = "Date cannot be in the past";

    if (!formData.time) nextErrors.time = "Pick a time slot";
    else if (formData.date === today) {
      const now = new Date();
      const [hour, minute] = formData.time.split(":").map(Number);
      const slot = new Date();
      slot.setHours(hour, minute, 0, 0);
      if (slot.getTime() - now.getTime() < 30 * 60 * 1000)
        nextErrors.time = "Pick a slot at least 30 minutes from now";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!user) {
      toast.error("Please sign in to book a table");
      navigate("/login", { state: { from: "/book-table" } });
      return;
    }

    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/booking/create", {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        numberOfPeople: Number(formData.numberOfPeople),
        note: formData.note.trim(),
      });
      if (data.success) {
        toast.success(data.message || "Table booked successfully");
        navigate("/my-bookings");
      } else {
        toast.error(data.message || "Could not complete your booking");
      }
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 401) {
        toast.error("Your session expired. Please sign in again.");
        navigate("/login", { state: { from: "/book-table" } });
      } else if (message) {
        toast.error(message);
        // the API rejects a slot that is already taken — point the user at the field
        if (message.toLowerCase().includes("time slot")) {
          setErrors((prev) => ({ ...prev, time: message }));
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:ring-4 ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
        : "border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/15"
    }`;

  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="mt-1.5 text-xs font-medium text-red-500">{errors[field]}</p>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {/* Header */}
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-700">
            <CalendarDays className="h-3.5 w-3.5" />
            Reservations
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Book a <span className="text-yellow-500">Table</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500">
            Reserve your spot in a few seconds. We&apos;ll confirm your booking
            by phone shortly after.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Full name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    className={`${inputClass("name")} pl-10`}
                  />
                </div>
                <FieldError field="name" />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    className={`${inputClass("email")} pl-10`}
                  />
                </div>
                <FieldError field="email" />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+44 7700 900123"
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.phone)}
                    className={`${inputClass("phone")} pl-10`}
                  />
                </div>
                <FieldError field="phone" />
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Number of guests
                </span>
                <div
                  className={`flex items-center justify-between rounded-xl border px-2 py-1.5 ${
                    errors.numberOfPeople
                      ? "border-red-300"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => changeGuests(-1)}
                    disabled={Number(formData.numberOfPeople) <= 1}
                    aria-label="Decrease guests"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span
                    aria-live="polite"
                    className="flex items-center gap-2 text-sm font-semibold text-gray-800"
                  >
                    <Users className="h-4 w-4 text-gray-400" />
                    {formData.numberOfPeople}{" "}
                    {Number(formData.numberOfPeople) === 1 ? "guest" : "guests"}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeGuests(1)}
                    disabled={Number(formData.numberOfPeople) >= MAX_GUESTS}
                    aria-label="Increase guests"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <FieldError field="numberOfPeople" />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={today}
                  max={maxDate}
                  aria-invalid={Boolean(errors.date)}
                  className={`${inputClass("date")} cursor-pointer`}
                />
                <FieldError field="date" />
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Time
                </label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.time)}
                  className={`${inputClass("time")} cursor-pointer ${
                    formData.time ? "" : "text-gray-400"
                  }`}
                >
                  <option value="">Select a time slot</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {formatSlotLabel(slot)}
                    </option>
                  ))}
                </select>
                <FieldError field="time" />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="note"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Special requests{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Allergies, celebrations, seating preferences..."
                rows="4"
                maxLength={300}
                className={`${inputClass("note")} resize-none`}
              />
              <p className="mt-1.5 text-right text-xs text-gray-400">
                {formData.note.length}/300
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-yellow-600 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-yellow-500"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Confirming...
                </>
              ) : (
                "Confirm Booking"
              )}
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Your table is held for 15 minutes past the reserved time.
            </p>
          </form>

          {/* Info sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                <Clock className="h-4 w-4 text-yellow-500" />
                Opening hours
              </h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Mon &ndash; Thu</dt>
                  <dd className="font-medium text-gray-800">11:00 &ndash; 22:00</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Fri &ndash; Sat</dt>
                  <dd className="font-medium text-gray-800">11:00 &ndash; 23:00</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sunday</dt>
                  <dd className="font-medium text-gray-800">12:00 &ndash; 21:00</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Need help?
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                  <span className="text-gray-600">+44 20 7946 0123</span>
                </li>
                {/* TODO: add the real address, then uncomment */}
                {/*
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                  <span className="text-gray-600">
                    12 High Street, London, UK
                  </span>
                </li>
                */}
              </ul>
            </div>

            <div className="rounded-2xl border border-yellow-100 bg-yellow-50/70 p-6">
              <h2 className="text-sm font-semibold text-gray-800">
                Good to know
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>&bull; Bookings are confirmed by our team.</li>
                <li>&bull; Parties over {MAX_GUESTS} guests, please call us.</li>
                <li>&bull; You can review your bookings under My Bookings.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BookTable;
