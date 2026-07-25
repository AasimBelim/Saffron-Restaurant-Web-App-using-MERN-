import { useId } from "react";

/**
 * Saffron brand mark + wordmark, drawn inline so it stays sharp at any size and
 * needs no network request. `variant="light"` is for dark backgrounds (footer).
 *
 * The mark is a bowl with steam rising from it — its curve reads as a smile, so
 * two eyes sit in the gap between the raised steam and the bowl. All curves and
 * round caps, so nothing reads as pointed at small sizes.
 */
const Logo = ({ variant = "dark", showWordmark = true, className = "" }) => {
  const gradientId = useId();
  const isLight = variant === "light";

  return (
    <span className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        role="img"
        aria-label="Saffron"
        // keeps the 4:3 ratio against the wordmark that reads as one lockup
        className="h-[34px] w-[34px] shrink-0 sm:h-[40px] sm:w-[40px]"
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="4"
            y1="2"
            x2="36"
            y2="38"
          >
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />

        {/* steam */}
        <g
          fill="none"
          stroke="white"
          strokeWidth="1.9"
          strokeLinecap="round"
          opacity="0.9"
        >
          <path d="M16.4 13c-1.5-1.3-1.5-2.9 0-4.2s1.5-2.9 0-4.2" />
          <path d="M23.6 13c-1.5-1.3-1.5-2.9 0-4.2s1.5-2.9 0-4.2" />
        </g>

        {/* eyes — in the gap above the bowl */}
        <g fill="white">
          <circle cx="16" cy="18" r="1.5" />
          <circle cx="24" cy="18" r="1.5" />
        </g>
        {/* bowl — outline only, its curve reads as the smile */}
        <path
          d="M12 23.8h16a8 8 0 0 1-16 0Z"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* rim */}
        <path
          d="M9.8 22.8h20.4"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>

      {showWordmark && (
        <span
          className={`text-2xl font-extrabold leading-none tracking-tight sm:text-3xl ${isLight ? "text-white" : "text-gray-900"
            }`}
        >
          Saffr<span className="text-amber-500">on</span>
        </span>
      )}
    </span>
  );
};

export default Logo;
