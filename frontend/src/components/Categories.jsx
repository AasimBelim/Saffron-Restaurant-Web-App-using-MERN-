import { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { AlertCircle, ArrowUpRight, LayoutGrid } from "lucide-react";

// auto-fit lets the tracks stretch, so 3 categories fill the row just as well as 9
const GRID_CLASS =
  "grid gap-5 grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]";

const Categories = () => {
  const { navigate, categories, menus, dataLoading, dataError, loadData } =
    useContext(AppContext);

  // how many dishes sit under each category, so the cards carry real information
  const dishCounts = useMemo(() => {
    return menus.reduce((counts, menu) => {
      const id = menu.category?._id;
      if (id) counts[id] = (counts[id] || 0) + 1;
      return counts;
    }, {});
  }, [menus]);

  const showSkeletons = dataLoading && categories.length === 0;
  const showError = !dataLoading && dataError && categories.length === 0;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-700">
            <LayoutGrid className="h-3.5 w-3.5" />
            Categories
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Explore Our <span className="text-yellow-500">Categories</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-500">
            Discover delicious dishes from our carefully curated categories.
          </p>
        </header>

        {showSkeletons ? (
          <div className={`mt-12 ${GRID_CLASS}`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
              >
                <div className="aspect-[16/10] animate-pulse bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-14 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : showError ? (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-red-100 bg-red-50/60 px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="mt-4 text-sm text-gray-600">{dataError}</p>
            <button
              type="button"
              onClick={() => loadData()}
              className="mt-5 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
            >
              Try again
            </button>
          </div>
        ) : categories.length === 0 ? (
          <p className="mt-12 text-center text-gray-500">
            Categories are being set up. Please check back soon.
          </p>
        ) : (
          <div className={`mt-12 ${GRID_CLASS}`}>
            {categories.map((cat) => {
              const count = dishCounts[cat._id] || 0;
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => navigate(`/menu?category=${cat._id}`)}
                  aria-label={`View ${cat.name} dishes`}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gray-50">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-gray-900 transition-colors duration-200 group-hover:text-yellow-600">
                        {cat.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {count} {count === 1 ? "dish" : "dishes"}
                      </p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all duration-300 group-hover:bg-yellow-500 group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;
