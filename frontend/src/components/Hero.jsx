import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { ArrowRight, CalendarDays, Clock, Star } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1920&q=80";

const Hero = () => {
  const { navigate, menus, categories } = useContext(AppContext);

  const stats = [
    { icon: Star, value: "4.8", label: "Average rating" },
    {
      icon: Clock,
      value: "25 min",
      label: "Average delivery",
    },
    {
      icon: CalendarDays,
      value: menus.length ? `${menus.length}+` : "Fresh",
      label: menus.length
        ? `Dishes across ${categories.length || 0} categories`
        : "Dishes made daily",
    },
  ];

  return (
    // fills the viewport minus the sticky navbar (h-16, sm:h-18) so no gap shows below
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden sm:min-h-[calc(100svh-4.5rem)]">
      {/* Background */}
      <img
        src={HERO_IMAGE}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/85" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          Rated 4.8 by 2,000+ guests
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Made fresh. <span className="text-yellow-400">Served fast.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-200 sm:text-lg">
          Handcrafted dishes made with the finest ingredients. Order in minutes
          or reserve your table tonight &mdash; that&apos;s Saffron.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-yellow-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-yellow-500/20 transition-all duration-200 hover:bg-yellow-600 hover:shadow-xl active:scale-[0.98]"
          >
            Explore Menu
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/book-table")}
            className="cursor-pointer rounded-full border-2 border-white/70 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-900 active:scale-[0.98]"
          >
            Book a Table
          </button>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-14 grid max-w-2xl grid-cols-1 gap-4 border-t border-white/15 pt-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-center gap-3 sm:flex-col sm:gap-1.5"
            >
              <stat.icon className="h-5 w-5 text-yellow-400" />
              <div className="text-left sm:text-center">
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-300">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
