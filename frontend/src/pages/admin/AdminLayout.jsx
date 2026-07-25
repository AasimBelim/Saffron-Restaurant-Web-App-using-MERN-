import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import {
  BookOpen,
  Grid3X3,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  PlusCircle,
  ShoppingCart,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Logo from "../../components/Logo";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { path: "/admin", name: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { path: "/admin/categories", name: "All Categories", icon: Grid3X3 },
      { path: "/admin/menus", name: "All Menus", icon: UtensilsCrossed },
      { path: "/admin/add-category", name: "Add Category", icon: PlusCircle },
      { path: "/admin/add-menu", name: "Add Menu", icon: Package },
    ],
  },
  {
    label: "Operations",
    items: [
      { path: "/admin/orders", name: "Orders", icon: ShoppingCart },
      { path: "/admin/bookings", name: "Bookings", icon: BookOpen },
    ],
  },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

const AdminLayout = () => {
  const { logout } = useContext(AppContext);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // close the drawer whenever the route changes
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const currentPage =
    ALL_ITEMS.find((item) =>
      item.end
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path)
    )?.name || "Admin Panel";

  const adminEmail = (() => {
    try {
      return JSON.parse(localStorage.getItem("admin") || "{}").admin || "";
    } catch {
      return "";
    }
  })();

  const navLinkClass = ({ isActive }) =>
    `relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "bg-yellow-50 text-yellow-700"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    }`;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center border-b border-gray-100 px-5">
            <Logo />
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      className={navLinkClass}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-yellow-500" />
                          )}
                          <item.icon size={18} className="shrink-0" />
                          {item.name}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="shrink-0 border-t border-gray-100 p-3">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-700">
                A
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Admin</p>
                <p className="truncate text-xs text-gray-400">
                  {adminEmail || "Signed in"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout({ redirectTo: null })}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
            className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>

          <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
            {currentPage}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
