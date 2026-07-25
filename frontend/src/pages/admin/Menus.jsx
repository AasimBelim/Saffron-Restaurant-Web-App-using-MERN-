import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { PlusCircle, Search, Trash2, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../components/ConfirmDialog";
import { formatCurrency } from "../../utils/format";

const Menus = () => {
  const { menus, categories, fetchMenus, dataLoading, axios } =
    useContext(AppContext);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return menus.filter((menu) => {
      const matchesTerm =
        !term ||
        menu.name?.toLowerCase().includes(term) ||
        menu.description?.toLowerCase().includes(term);
      const matchesCategory =
        categoryFilter === "all" || menu.category?._id === categoryFilter;
      return matchesTerm && matchesCategory;
    });
  }, [menus, query, categoryFilter]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { data } = await axios.delete(
        `/api/menu/delete/${pendingDelete._id}`
      );
      if (data.success) {
        toast.success(data.message);
        await fetchMenus();
        setPendingDelete(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't delete the dish.");
    } finally {
      setDeleting(false);
    }
  };

  const showSkeletons = dataLoading && menus.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes..."
              aria-label="Search dishes"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/15"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 outline-none transition-all focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/15"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <Link
          to="/admin/add-menu"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-yellow-600"
        >
          <PlusCircle className="h-4 w-4" />
          Add menu item
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="hidden grid-cols-[88px_1fr_160px_110px_88px] gap-4 border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 md:grid">
          <span>Image</span>
          <span>Name</span>
          <span>Category</span>
          <span>Price</span>
          <span className="text-right">Action</span>
        </div>

        {showSkeletons ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-16 w-16 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : menus.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <UtensilsCrossed className="h-6 w-6 text-gray-400" />
            </div>
            <h2 className="mt-4 font-semibold text-gray-900">
              No menu items yet
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add your first dish so customers have something to order.
            </p>
            <Link
              to="/admin/add-menu"
              className="mt-5 inline-block rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
            >
              Add menu item
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-gray-500">
            No dishes match your filters.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((item) => (
              <li
                key={item._id}
                className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60 md:grid-cols-[88px_1fr_160px_110px_88px]"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-gray-400 md:hidden">
                    {item.category?.name || "Uncategorised"} &middot;{" "}
                    {formatCurrency(item.price)}
                  </p>
                  {!item.isAvailable && (
                    <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-200">
                      Unavailable
                    </span>
                  )}
                </div>
                <span className="hidden truncate text-sm text-gray-500 md:block">
                  {item.category?.name || "Uncategorised"}
                </span>
                <span className="hidden text-sm font-semibold text-gray-900 md:block">
                  {formatCurrency(item.price)}
                </span>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPendingDelete(item)}
                    aria-label={`Delete ${item.name}`}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        busy={deleting}
        title={`Delete "${pendingDelete?.name}"?`}
        message="This removes the dish from the menu for all customers. This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Menus;
