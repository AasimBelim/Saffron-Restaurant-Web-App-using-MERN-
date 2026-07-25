const MenuCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="aspect-[4/3] w-full animate-pulse bg-gray-200" />
    <div className="p-5">
      <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-gray-100" />
      <div className="mt-6 flex items-center justify-between">
        <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-24 animate-pulse rounded-full bg-gray-200" />
      </div>
    </div>
  </div>
);

export default MenuCardSkeleton;
