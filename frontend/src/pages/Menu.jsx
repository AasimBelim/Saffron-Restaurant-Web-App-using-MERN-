import { useContext, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { AlertCircle, Search, SlidersHorizontal, UtensilsCrossed, X } from "lucide-react";
import MenuCard from "../components/MenuCard";
import MenuCardSkeleton from "../components/MenuCardSkeleton";

const SORT_OPTIONS = [
  { value: "default", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
];

const Menu = () => {
  const { menus, categories, dataLoading, dataError, loadData } =
    useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // the active category lives in the URL so category tiles on the home page can
  // deep-link here and the filtered view stays shareable
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";

  const setActiveCategory = (categoryId) => {
    const next = new URLSearchParams(searchParams);
    if (categoryId === "all") next.delete("category");
    else next.set("category", categoryId);
    setSearchParams(next, { replace: true });
  };

  const filteredMenus = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = menus.filter((menu) => {
      const matchesQuery =
        !query ||
        menu.name?.toLowerCase().includes(query) ||
        menu.description?.toLowerCase().includes(query);
      const matchesCategory =
        activeCategory === "all" || menu.category?._id === activeCategory;
      return matchesQuery && matchesCategory;
    });

    switch (sortBy) {
      case "price-asc":
        return [...result].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...result].sort((a, b) => b.price - a.price);
      case "name-asc":
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return result;
    }
  }, [menus, searchQuery, activeCategory, sortBy]);

  const isFiltered = searchQuery.trim() !== "" || activeCategory !== "all";

  const resetFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setSortBy("default");
  };

  const showSkeletons = dataLoading && menus.length === 0;
  const showError = !dataLoading && dataError && menus.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16">
        {/* Header */}
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-700">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Freshly made daily
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Our <span className="text-yellow-500">Menu</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500">
            Explore our delicious selection of handcrafted dishes made with the
            finest ingredients.
          </p>
        </header>

        {/* Search */}
        <div className="mx-auto mt-8 max-w-2xl">
          <label htmlFor="menu-search" className="sr-only">
            Search dishes
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="menu-search"
              type="search"
              placeholder="Search for your favorite dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-white py-3.5 pl-12 pr-12 text-gray-700 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {!showError && (
          <div className="mt-8 flex flex-col gap-4 border-b border-gray-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                aria-pressed={activeCategory === "all"}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeCategory === "all"
                    ? "bg-yellow-500 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-yellow-300 hover:text-yellow-600"
                }`}
              >
                All dishes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setActiveCategory(cat._id)}
                  aria-pressed={activeCategory === cat._id}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat._id
                      ? "bg-yellow-500 text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-yellow-300 hover:text-yellow-600"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              <label htmlFor="menu-sort" className="sr-only">
                Sort dishes
              </label>
              <select
                id="menu-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 outline-none transition-colors hover:border-yellow-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/15"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Result count */}
        {!showError && !showSkeletons && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500" aria-live="polite">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredMenus.length}
              </span>{" "}
              {filteredMenus.length === 1 ? "dish" : "dishes"}
              {searchQuery.trim() && (
                <>
                  {" "}
                  for &ldquo;
                  <span className="font-semibold text-gray-900">
                    {searchQuery.trim()}
                  </span>
                  &rdquo;
                </>
              )}
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-semibold text-yellow-600 underline-offset-4 transition-colors hover:text-yellow-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="mt-8">
          {showSkeletons ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <MenuCardSkeleton key={i} />
              ))}
            </div>
          ) : showError ? (
            <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Couldn&apos;t load the menu
              </h2>
              <p className="mt-2 text-sm text-gray-500">{dataError}</p>
              <button
                type="button"
                onClick={() => loadData()}
                className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
              >
                Try again
              </button>
            </div>
          ) : filteredMenus.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMenus.map((menu) => (
                <MenuCard menu={menu} key={menu._id} />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <UtensilsCrossed className="h-6 w-6 text-gray-400" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                No dishes found
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {isFiltered
                  ? "Try a different search term or category."
                  : "Our menu is being updated. Please check back soon."}
              </p>
              {isFiltered && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
