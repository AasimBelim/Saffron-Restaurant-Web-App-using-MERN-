import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { AppContext } from "../context/AppContext";
import Logo from "../components/Logo";

const MIN_PASSWORD_LENGTH = 6;

const Signup = () => {
  const { navigate, axios, loading, setLoading } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) nextErrors.name = "Please enter your name";
    else if (formData.name.trim().length < 2)
      nextErrors.name = "Name looks too short";

    if (!formData.email.trim()) nextErrors.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim()))
      nextErrors.email = "Enter a valid email address";

    if (!formData.password) nextErrors.password = "Please choose a password";
    else if (formData.password.length < MIN_PASSWORD_LENGTH)
      nextErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;

    if (formData.confirmPassword !== formData.password)
      nextErrors.confirmPassword = "Passwords don't match";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    try {
      setLoading(true);
      const { data } = await axios.post("/api/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      if (data.success) {
        toast.success(data.message);
        navigate("/login");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      // a network failure has no `response`, so this must stay optional
      toast.error(
        error?.response?.data?.message ||
          "Couldn't create your account. Please try again."
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

  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="mt-1.5 text-xs font-medium text-red-500">{errors[field]}</p>
    ) : null;

  const passwordLongEnough = formData.password.length >= MIN_PASSWORD_LENGTH;

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
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            It takes less than a minute.
          </p>

          <div className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onChangeHandler}
                  placeholder="John Doe"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  className={`${inputClass("name")} pr-4`}
                />
              </div>
              <FieldError field="name" />
            </div>

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
              <FieldError field="email" />
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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
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
              <FieldError field="password" />
              {!errors.password && formData.password && (
                <p
                  className={`mt-1.5 flex items-center gap-1.5 text-xs ${
                    passwordLongEnough ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  At least {MIN_PASSWORD_LENGTH} characters
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={onChangeHandler}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className={`${inputClass("confirmPassword")} pr-4`}
                />
              </div>
              <FieldError field="confirmPassword" />
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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-yellow-600 underline-offset-4 transition-colors hover:text-yellow-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
