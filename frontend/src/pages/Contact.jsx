import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  // MapPin + Navigation are used by the address card / map — re-import when those
  // blocks are uncommented.
  Send,
  UtensilsCrossed,
} from "lucide-react";

// TODO: replace with the real restaurant address, then uncomment the Address
// card in CONTACT_DETAILS and the map block in the markup below.
// const ADDRESS_LINES = ["123 Restaurant Street", "Food District, City 12345"];
// const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
//   ADDRESS_LINES.join(", ")
// )}`;

const CONTACT_DETAILS = [
  // {
  //   icon: MapPin,
  //   title: "Address",
  //   lines: ADDRESS_LINES,
  // },
  {
    icon: Phone,
    title: "Phone",
    lines: ["+1 (555) 123-4567", "+1 (555) 987-6543"],
    href: (value) => `tel:${value.replace(/[^\d+]/g, "")}`,
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["hello@saffron.co", "reservations@saffron.co"],
    href: (value) => `mailto:${value}`,
  },
  {
    icon: Clock,
    title: "Opening Hours",
    lines: [
      "Monday - Friday: 11:00 AM - 10:00 PM",
      "Saturday - Sunday: 10:00 AM - 11:00 PM",
    ],
  },
];

const SUBJECTS = [
  "General inquiry",
  "Reservation",
  "Private event / catering",
  "Feedback",
  "Careers",
];

const MESSAGE_LIMIT = 600;

const Contact = () => {
  const { navigate, user } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const resetTimer = useRef(null);

  // prefill from the signed-in user once auth resolves
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.name || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  // the success banner auto-dismisses; clear the timer if the page unmounts first
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
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
    if (formData.phone.trim() && (digits.length < 10 || digits.length > 15))
      nextErrors.phone = "Enter a valid phone number";

    if (!formData.subject) nextErrors.subject = "Pick a subject";

    if (!formData.message.trim()) nextErrors.message = "Please write a message";
    else if (formData.message.trim().length < 10)
      nextErrors.message = "Tell us a little more (min 10 characters)";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    // no contact endpoint on the API yet — swap this for the real request when it exists
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setSubmitted(true);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    resetTimer.current = setTimeout(() => setSubmitted(false), 6000);
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
      {/* Hero */}
      <section className="relative h-72 overflow-hidden sm:h-80">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            <MessageSquare className="h-3.5 w-3.5" />
            Contact us
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Get In <span className="text-yellow-400">Touch</span>
          </h1>
          <p className="mt-3 max-w-xl text-base text-gray-200 sm:text-lg">
            Questions, feedback or a special occasion to plan? We&apos;d love to
            hear from you.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Contact information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Contact Information
            </h2>
            <p className="mt-2 text-gray-500">
              Reach us any way you like &mdash; we usually reply within a few
              hours.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {CONTACT_DETAILS.map((detail) => (
                <div
                  key={detail.title}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100">
                    <detail.icon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">
                    {detail.title}
                  </h3>
                  <div className="mt-1.5 space-y-1 text-sm text-gray-500">
                    {detail.lines.map((line) =>
                      detail.href ? (
                        <a
                          key={line}
                          href={detail.href(line)}
                          className="block break-words transition-colors hover:text-yellow-600"
                        >
                          {line}
                        </a>
                      ) : (
                        <p key={line}>{line}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Map — uncomment once ADDRESS_LINES holds the real address */}
            {/*
            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <iframe
                title="Restaurant location map"
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  ADDRESS_LINES.join(", ")
                )}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0 grayscale-[25%]"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {ADDRESS_LINES[0]}
                  </p>
                  <p className="text-sm text-gray-500">{ADDRESS_LINES[1]}</p>
                </div>
                <a
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-yellow-300 hover:text-yellow-600"
                >
                  <Navigation className="h-4 w-4" />
                  Get directions
                </a>
              </div>
            </div>
            */}

            {/* Quick actions */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate("/book-table")}
                className="flex items-center gap-3 rounded-2xl border border-yellow-100 bg-yellow-50/70 p-5 text-left transition-colors hover:bg-yellow-50"
              >
                <CalendarDays className="h-5 w-5 shrink-0 text-yellow-600" />
                <span>
                  <span className="block font-semibold text-gray-900">
                    Book a table
                  </span>
                  <span className="block text-sm text-gray-500">
                    Reserve in under a minute
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/menu")}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <UtensilsCrossed className="h-5 w-5 shrink-0 text-yellow-600" />
                <span>
                  <span className="block font-semibold text-gray-900">
                    Browse the menu
                  </span>
                  <span className="block text-sm text-gray-500">
                    See what&apos;s cooking today
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Send us a Message
              </h2>
              <p className="mt-2 text-gray-500">
                Fill in the form and our team will get back to you.
              </p>

              {submitted && (
                <div
                  role="status"
                  className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <p className="text-sm text-green-800">
                    Thank you! Your message has been sent &mdash; we&apos;ll be
                    in touch shortly.
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Name <span className="text-yellow-600">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                      className={inputClass("name")}
                    />
                    <FieldError field="name" />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Phone{" "}
                      <span className="font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      autoComplete="tel"
                      aria-invalid={Boolean(errors.phone)}
                      className={inputClass("phone")}
                    />
                    <FieldError field="phone" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Email <span className="text-yellow-600">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    className={inputClass("email")}
                  />
                  <FieldError field="email" />
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Subject <span className="text-yellow-600">*</span>
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.subject)}
                    className={`${inputClass("subject")} cursor-pointer ${
                      formData.subject ? "" : "text-gray-400"
                    }`}
                  >
                    <option value="">What is this about?</option>
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  <FieldError field="subject" />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Message <span className="text-yellow-600">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    maxLength={MESSAGE_LIMIT}
                    placeholder="Tell us what's on your mind..."
                    aria-invalid={Boolean(errors.message)}
                    className={`${inputClass("message")} resize-none`}
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <FieldError field="message" />
                    <p className="ml-auto text-xs text-gray-400">
                      {formData.message.length}/{MESSAGE_LIMIT}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-yellow-600 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-yellow-500"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-gray-400">
                We&apos;ll only use your details to reply to this enquiry.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
