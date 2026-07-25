import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  LogOut,
  Menu as MenuIcon,
  Package,
  ShoppingCart,
  UserCircle,
  X,
} from "lucide-react";
import Logo from "./Logo";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menus" },
  { to: "/book-table", label: "Book Table" },
  { to: "/contact", label: "Contact" },
];

const ACCOUNT_LINKS = [
  { to: "/my-bookings", label: "My Bookings", icon: Calendar },
  { to: "/my-orders", label: "My Orders", icon: Package },
];

const Navbar = () => {
  const { navigate, user, cartCount, logout } = useContext(AppContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();

  // close both menus whenever the route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // the profile dropdown opens on click, so it needs outside-click and Escape to close
  useEffect(() => {
    if (!isProfileOpen) return;
    const onPointerDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isProfileOpen]);

  // subtle elevation once the page scrolls under the bar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-yellow-500 after:transition-all after:duration-300 ${
      isActive
        ? "text-gray-900 after:w-full"
        : "text-gray-500 hover:text-gray-900 after:w-0 hover:after:w-full"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? "bg-yellow-50 text-yellow-700"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  // a guest has no cart on the server, so never show a count for one
  const badgeCount = user ? cartCount || 0 : 0;

  return (
    <nav
      className={`sticky top-0 z-50 border-b bg-white transition-shadow duration-300 ${
        scrolled ? "border-gray-200 shadow-sm" : "border-gray-100"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 sm:h-18">
          {/* Logo */}
          <Link
            to="/"
            className="shrink-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
            aria-label="Saffron — go to home page"
          >
            <Logo />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass} end>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => navigate("/cart")}
              aria-label={`Cart, ${badgeCount} ${
                badgeCount === 1 ? "item" : "items"
              }`}
              className="relative rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
            >
              <ShoppingCart size={21} />
              {badgeCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1 text-[11px] font-semibold text-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </button>

            {/* Account — desktop */}
            <div className="hidden md:block">
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={isProfileOpen}
                    className="flex items-center gap-1.5 rounded-xl p-1.5 pr-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                  >
                    <UserCircle size={26} />
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isProfileOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-lg"
                    >
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {user.email}
                        </p>
                      </div>

                      {ACCOUNT_LINKS.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                        >
                          <item.icon size={17} className="text-gray-400" />
                          {item.label}
                        </Link>
                      ))}

                      <div className="mt-1.5 border-t border-gray-100 pt-1.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => logout()}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut size={17} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="cursor-pointer rounded-full bg-yellow-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-yellow-600 hover:shadow-md active:scale-95"
                >
                  Login
                </button>
              )}
            </div>

            {/* Hamburger — mobile */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              className="rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 md:hidden"
            >
              {isMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {isMenuOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={mobileLinkClass}
                  end
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              {user ? (
                <>
                  <div className="px-4 pb-2">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {ACCOUNT_LINKS.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={mobileLinkClass}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon size={17} className="text-gray-400" />
                          {item.label}
                        </span>
                      </NavLink>
                    ))}
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full rounded-xl bg-yellow-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
