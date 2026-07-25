import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { AlertCircle, ArrowRight, UtensilsCrossed } from "lucide-react";
import MenuCard from "./MenuCard";
import MenuCardSkeleton from "./MenuCardSkeleton";

// the home page shows a preview; the full list lives on /menu
const PREVIEW_COUNT = 8;

const Menus = () => {
  const { navigate, menus, dataLoading, dataError, loadData } =
    useContext(AppContext);

  const previewMenus = menus.slice(0, PREVIEW_COUNT);
  const showSkeletons = dataLoading && menus.length === 0;
  const showError = !dataLoading && dataError && menus.length === 0;

  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-700">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Our dishes
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Our <span className="text-yellow-500">Menu</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-500">
            Explore our delicious selection of handcrafted dishes made with the
            finest ingredients.
          </p>
        </header>

        {showSkeletons ? (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
              <MenuCardSkeleton key={i} />
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
        ) : menus.length === 0 ? (
          <p className="mt-12 text-center text-gray-500">
            Our menu is being updated. Please check back soon.
          </p>
        ) : (
          <>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {previewMenus.map((menu) => (
                <MenuCard key={menu._id} menu={menu} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => navigate("/menu")}
                className="inline-flex items-center gap-2 rounded-full bg-yellow-500 px-7 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-yellow-600 hover:shadow-md active:scale-[0.98]"
              >
                {menus.length > PREVIEW_COUNT
                  ? `View all ${menus.length} dishes`
                  : "View full menu"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Menus;
