import { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "react-hot-toast";
import { AppContext } from "../context/AppContext";
import Logo from "../components/Logo";

const Login = () => {
  // the cart is loaded by the context as soon as `user` is set, so there is
  // nothing to fetch here
  const { navigate, loading, setLoading, axios, setUser, setAdmin } =
    useContext(AppContext);
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.email.trim()) nextErrors.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim()))
      nextErrors.email = "Enter a valid email address";
    if (!formData.password) nextErrors.password = "Please enter your password";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    try {
      setLoading(true);
      const { data } = await axios.post("/api/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });
      if (data.success && data.isAdmin) {
        // same form, same endpoint — the API tells us which kind of account this is
        localStorage.setItem("admin", JSON.stringify(data.admin));
        setAdmin(true);
        toast.success(data.message);
        navigate("/admin");
      } else if (data.success) {
        setUser(data.user);
        toast.success(data.message);
        // return the user to wherever they were headed before being asked to sign in,
        // but never to an admin route they cannot open
        const from = location.state?.from;
        navigate(from && !from.startsWith("/admin") ? from : "/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      // a network failure has no `response`, so this must stay optional
      toast.error(
        error?.response?.data?.message || "Couldn't sign you in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-white py-3 pl-11 text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:ring-4 ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
        : "border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/15"
    }`;

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-12 sm:min-h-[calc(100svh-4.5rem)]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo showWordmark={false} />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sign in to order, book a table and track your orders.
          </p>

          <div className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onChangeHandler}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  className={`${inputClass("email")} pr-4`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={onChangeHandler}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  className={`${inputClass("password")} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-yellow-600 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-yellow-500"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-yellow-600 underline-offset-4 transition-colors hover:text-yellow-700 hover:underline"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
