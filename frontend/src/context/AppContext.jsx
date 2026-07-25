import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
export const AppContext = createContext();

import axios from "axios";
const baseURL = import.meta.env.VITE_BASE_URL;
if (!baseURL) {
  console.error(
    "VITE_BASE_URL is missing. Add it to frontend/.env and restart the vite dev server."
  );
}
axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true;
import { toast } from "react-hot-toast";

// retries a request a few times so a slow/cold backend does not leave the page empty
const withRetry = async (request, retries = 3, delay = 700) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const { data } = await request();
      if (data?.success) return data;
      throw new Error(data?.message || "Request failed");
    } catch (error) {
      if (attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};

const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  // `user` is null both before and after the auth check resolves — this tells
  // the two apart so we never send a signed-in user to the login page
  const [authChecked, setAuthChecked] = useState(false);
  // AdminLogin stores the admin in localStorage but nothing read it back, so a
  // refresh dropped the session even though the auth cookie was still valid
  const [admin, setAdmin] = useState(() => {
    try {
      return localStorage.getItem("admin") ? true : null;
    } catch {
      return null;
    }
  });
  const [categories, setCategories] = useState([]);
  const [menus, setMenus] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // the cart lives on the server per user, so the client copy must never
  // outlive the session that owns it
  const clearCart = () => setCart([]);

  const fetchCartData = async () => {
    try {
      const { data } = await axios.get("/api/cart/get");
      // a user with no cart yet comes back as `{ items: [] }` with no `success`
      setCart(data.success ? data.cart : []);
    } catch (error) {
      // 401 means the session is gone — drop the stale cart instead of keeping
      // the previous user's items on screen
      if (error?.response?.status === 401) {
        setUser(null);
        clearCart();
        return;
      }
      console.log(error);
    }
  };
  useEffect(() => {
    const total = cart?.items
      ? cart.items.reduce(
          (sum, item) => sum + (item.menuItem?.price || 0) * item.quantity,
          0
        )
      : 0;
    setTotalPrice(total);
  }, [cart]);
  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0);
  // sends the guest to the login page and back to whatever page they were on
  const askToSignIn = (message) => {
    toast(message, { icon: "🔒" });
    navigate("/login", { state: { from: window.location.pathname } });
  };

  // 🔹 Add to Cart function
  const addToCart = async (menuId) => {
    // a guest hitting /api/cart/add gets a 401, which used to surface as a
    // generic "Something went wrong!" — tell them what to do instead
    if (authChecked && !user) {
      askToSignIn("Please sign in to add items to your cart");
      return;
    }

    try {
      const { data } = await axios.post("/api/cart/add", {
        menuId,
        quantity: 1,
      });
      if (data.success) {
        toast.success(data.message);
        fetchCartData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      // covers the guest whose session expired mid-visit, and the first click
      // that lands before the initial auth check has resolved
      if (error?.response?.status === 401) {
        setUser(null);
        askToSignIn("Please sign in to add items to your cart");
      } else {
        toast.error(
          error?.response?.data?.message || "Something went wrong!"
        );
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await withRetry(() => axios.get("/api/category/all"));
      setCategories(data.categories || []);
      return true;
    } catch (error) {
      console.log("Error fetching categories:", error);
      return false;
    }
  };
  const fetchMenus = async () => {
    try {
      const data = await withRetry(() => axios.get("/api/menu/all"));
      setMenus(data.menuItems || []);
      return true;
    } catch (error) {
      console.log("Error fetching menus:", error);
      return false;
    }
  };

  // loads categories + menus together and keeps a shared loading/error state
  const loadData = async ({ silent = false } = {}) => {
    if (!silent) setDataLoading(true);
    const [categoriesOk, menusOk] = await Promise.all([
      fetchCategories(),
      fetchMenus(),
    ]);
    setDataError(
      categoriesOk && menusOk
        ? null
        : "Couldn't load data from the server. Please try again."
    );
    setDataLoading(false);
  };

  const isAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/is-auth");
      // keep the same object when it is the same account, so re-checking on
      // focus does not re-render the tree or refetch the cart for no reason
      if (data.success) {
        setUser((prev) =>
          prev && prev._id === data.user?._id ? prev : data.user
        );
      } else {
        setUser(null);
      }
    } catch (error) {
      // only a rejected session signs the user out — a network blip must not
      if (error?.response?.status === 401) setUser(null);
      else console.log(error);
    } finally {
      setAuthChecked(true);
    }
  };

  // logging out has to wipe the cart too, otherwise the badge keeps showing the
  // previous user's item count until the next full page load
  const logout = async ({ redirectTo = "/" } = {}) => {
    try {
      const { data } = await axios.post("/api/auth/logout");
      if (!data.success) {
        toast.error(data.message || "Could not log out");
        return false;
      }
      setUser(null);
      clearCart();
      setAdmin(null);
      try {
        localStorage.removeItem("admin");
      } catch {
        // storage can be unavailable in private mode — the session is gone anyway
      }
      toast.success(data.message);
      if (redirectTo) navigate(redirectTo);
      return true;
    } catch (error) {
      console.log(error);
      toast.error("Could not log out. Please try again.");
      return false;
    }
  };

  useEffect(() => {
    isAuth();
    loadData();
  }, []);

  // the cart is fetched only once we know who (if anyone) is signed in, and is
  // emptied the moment there is no user — sign-out, expiry or a different account
  useEffect(() => {
    if (!authChecked) return;
    if (user) fetchCartData();
    else clearCart();
  }, [authChecked, user?._id]);

  // re-sync whenever the tab regains focus or the network comes back,
  // so changes made elsewhere show up without a manual refresh — including a
  // sign-out or an expired session in another tab, which must empty the cart
  useEffect(() => {
    const refresh = () => {
      loadData({ silent: true });
      isAuth();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const value = {
    navigate,
    loading,
    setLoading,
    user,
    setUser,
    authChecked,
    axios,
    admin,
    setAdmin,
    categories,
    fetchCategories,
    menus,
    fetchMenus,
    dataLoading,
    dataError,
    loadData,
    addToCart,
    cartCount,
    cart,
    totalPrice,
    fetchCartData,
    clearCart,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
