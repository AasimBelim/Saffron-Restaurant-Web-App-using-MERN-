import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { Grid3X3, PlusCircle, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../components/ConfirmDialog";

const Categories = () => {
  const { categories, menus, fetchCategories, dataLoading, axios } =
    useContext(AppContext);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // surface how many dishes a category holds, so deleting is an informed choice
  const dishCounts = useMemo(
    () =>
      menus.reduce((counts, menu) => {
        const id = menu.category?._id;
        if (id) counts[id] = (counts[id] || 0) + 1;
        return counts;
      }, {}),
    [menus]
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? categories.filter((c) => c.name?.toLowerCase().includes(term))
      : categories;
  }, [categories, query]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { data } = await axios.delete(
        `/api/category/delete/${pendingDelete._id}`
      );
      if (data.success) {
        toast.success(data.message);
        await fetchCategories();
        setPendingDelete(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't delete the category."
      );
    } finally {
      setDeleting(false);
    }
  };

  const showSkeletons = dataLoading && categories.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/15"
          />
        </div>
        <Link
          to="/admin/add-category"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-yellow-600"
        >
          <PlusCircle className="h-4 w-4" />
          Add category
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* header row — desktop only */}
        <div className="hidden grid-cols-[88px_1fr_120px_88px] gap-4 border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:grid">
          <span>Image</span>
          <span>Name</span>
          <span>Dishes</span>
          <span className="text-right">Action</span>
        </div>

        {showSkeletons ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-16 w-16 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Grid3X3 className="h-6 w-6 text-gray-400" />
            </div>
            <h2 className="mt-4 font-semibold text-gray-900">
              No categories yet
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add your first category to start organising the menu.
            </p>
            <Link
              to="/admin/add-category"
              className="mt-5 inline-block rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
            >
              Add category
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-gray-500">
            No categories match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((item) => {
              const count = dishCounts[item._id] || 0;
              return (
                <li
                  key={item._id}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60 sm:grid-cols-[88px_1fr_120px_88px]"
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
                    <p className="text-xs text-gray-400 sm:hidden">
                      {count} {count === 1 ? "dish" : "dishes"}
                    </p>
                  </div>
                  <span className="hidden text-sm text-gray-500 sm:block">
                    {count} {count === 1 ? "dish" : "dishes"}
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
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        busy={deleting}
        title={`Delete "${pendingDelete?.name}"?`}
        message={
          (dishCounts[pendingDelete?._id] || 0) > 0
            ? `This category still has ${
                dishCounts[pendingDelete._id]
              } dish(es) assigned to it. They will be left without a valid category. This cannot be undone.`
            : "This cannot be undone."
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Categories;
