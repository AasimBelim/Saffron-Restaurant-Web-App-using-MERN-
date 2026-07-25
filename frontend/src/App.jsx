import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import MenuDetails from "./pages/MenuDetails";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import BookTable from "./pages/BookTable";
import MyBookings from "./pages/MyBookings";
import MyOrders from "./pages/MyOrders";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";
import AdminLayout from "./pages/admin/AdminLayout";
import { useContext } from "react";
import { AppContext } from "./context/AppContext";
import AddCategory from "./pages/admin/AddCategory";
import AddMenu from "./pages/admin/AddMenu";
import Categories from "./pages/admin/Categories";
import Menus from "./pages/admin/Menus";
import Orders from "./pages/admin/Orders";
import Bookings from "./pages/admin/Bookings";
import Dashboard from "./pages/admin/Dashboard";
const App = () => {
  const adminPath = useLocation().pathname.includes("admin");
  const { admin } = useContext(AppContext);
  return (
    <div>
      <Toaster />
      {!adminPath && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/menu-details/:id" element={<MenuDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/book-table" element={<BookTable />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* admin routes — the parent guards, so children don't repeat the check.
            Signing in happens on the normal /login form for admins too. */}
        <Route
          path="/admin"
          element={
            admin ? (
              <AdminLayout />
            ) : (
              <Navigate to="/login" replace state={{ from: "/admin" }} />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="add-category" element={<AddCategory />} />
          <Route path="add-menu" element={<AddMenu />} />
          <Route path="categories" element={<Categories />} />
          <Route path="menus" element={<Menus />} />
          <Route path="orders" element={<Orders />} />
          <Route path="bookings" element={<Bookings />} />
        </Route>
      </Routes>
      {!adminPath && <Footer />}
    </div>
  );
};
export default App;
