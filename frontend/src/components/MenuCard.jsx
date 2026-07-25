import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Plus, ShoppingCart } from "lucide-react";

const MenuCard = ({ menu }) => {
  const { navigate, addToCart } = useContext(AppContext);
  const [adding, setAdding] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const openDetails = () => navigate(`/menu-details/${menu._id}`);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!menu.isAvailable || adding) return;
    setAdding(true);
    try {
      await addToCart(menu._id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-200 hover:shadow-xl">
      {/* Image */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`View details for ${menu.name}`}
        onClick={openDetails}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetails();
          }
        }}
        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
      >
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}
        <img
          src={menu.image}
          alt={menu.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } ${menu.isAvailable ? "" : "grayscale"}`}
        />

        {/* Gradient for badge legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {menu.category?.name && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
            {menu.category.name}
          </span>
        )}

        {!menu.isAvailable && (
          <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Unavailable
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3
          onClick={openDetails}
          className="line-clamp-1 cursor-pointer text-lg font-bold text-gray-900 transition-colors duration-200 group-hover:text-yellow-600"
          title={menu.name}
        >
          {menu.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
          {menu.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="text-xl font-bold text-gray-900">
            ${Number(menu.price).toFixed(2)}
          </p>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!menu.isAvailable || adding}
            aria-label={`Add ${menu.name} to cart`}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 ${
              menu.isAvailable
                ? "bg-yellow-500 text-white shadow-sm hover:bg-yellow-600 hover:shadow-md active:scale-95 disabled:cursor-wait disabled:opacity-70"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            }`}
          >
            {menu.isAvailable ? (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span>{adding ? "Adding..." : "Add"}</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Sold out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default MenuCard;
