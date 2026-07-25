const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// bookings store the date as a plain "YYYY-MM-DD" string. Passing that to
// `new Date()` parses it as UTC midnight, which renders as the previous day in
// any negative-offset timezone — so read the parts directly instead.
export const formatDateString = (value) => {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const [, year, month, day] = match;
    return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatTimestamp(parsed);
};

// for real timestamps (createdAt), where local-time conversion is correct
export const formatTimestamp = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

// "15:47" -> "3:47 PM"
export const formatTimeString = (value) => {
  if (!value) return "—";
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${match[2]} ${suffix}`;
};

export const formatCurrency = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "—";
};
