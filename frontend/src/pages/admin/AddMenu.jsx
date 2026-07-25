import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const DESCRIPTION_LIMIT = 300;

const AddMenu = () => {
  const { axios, navigate, loading, setLoading, categories, fetchMenus } =
    useContext(AppContext);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // object URLs must be released or the blob stays in memory for the session
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const selectFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setErrors((prev) => ({ ...prev, image: "Use a JPG, PNG or WebP image" }));
      return;
    }
    if (selectedFile.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({ ...prev, image: "Image must be under 5 MB" }));
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) nextErrors.name = "Please enter a dish name";
    else if (formData.name.trim().length < 2)
      nextErrors.name = "Name looks too short";

    const price = Number(formData.price);
    if (formData.price === "") nextErrors.price = "Please enter a price";
    else if (!Number.isFinite(price) || price <= 0)
      nextErrors.price = "Price must be greater than 0";

    if (!formData.description.trim())
      nextErrors.description = "Please add a description";
    else if (formData.description.trim().length < 10)
      nextErrors.description = "Give customers a little more detail";

    if (!formData.category) nextErrors.category = "Pick a category";
    if (!file) nextErrors.image = "Please choose an image";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("price", Number(formData.price));
      payload.append("description", formData.description.trim());
      payload.append("category", formData.category);
      payload.append("image", file);

      const { data } = await axios.post("/api/menu/add", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        toast.success(data.message);
        await fetchMenus();
        navigate("/admin/menus");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't add the dish.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:ring-4 ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
        : "border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/15"
    }`;

  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="mt-1.5 text-xs font-medium text-red-500">{errors[field]}</p>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-lg font-bold text-gray-900">New menu item</h2>
      <p className="mt-1 text-sm text-gray-500">
        This is what customers see on the menu and dish detail pages.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="menu-name"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Dish name <span className="text-yellow-600">*</span>
          </label>
          <input
            id="menu-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Margherita Pizza"
            aria-invalid={Boolean(errors.name)}
            className={inputClass("name")}
          />
          <FieldError field="name" />
        </div>

        <div>
          <label
            htmlFor="menu-price"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Price <span className="text-yellow-600">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              $
            </span>
            <input
              id="menu-price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              aria-invalid={Boolean(errors.price)}
              className={`${inputClass("price")} pl-8`}
            />
          </div>
          <FieldError field="price" />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="menu-category"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Category <span className="text-yellow-600">*</span>
          </label>
          <select
            id="menu-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            aria-invalid={Boolean(errors.category)}
            className={`${inputClass("category")} cursor-pointer ${
              formData.category ? "" : "text-gray-400"
            }`}
          >
            <option value="">Select a category</option>
            {categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <FieldError field="category" />
          {categories.length === 0 && (
            <p className="mt-1.5 text-xs text-gray-400">
              No categories yet — add one first.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="menu-description"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Description <span className="text-yellow-600">*</span>
          </label>
          <textarea
            id="menu-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            maxLength={DESCRIPTION_LIMIT}
            placeholder="Describe the dish, key ingredients and anything notable."
            aria-invalid={Boolean(errors.description)}
            className={`${inputClass("description")} resize-none`}
          />
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <FieldError field="description" />
            <p className="ml-auto text-xs text-gray-400">
              {formData.description.length}/{DESCRIPTION_LIMIT}
            </p>
          </div>
        </div>

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">
            Dish image <span className="text-yellow-600">*</span>
          </span>

          <input
            ref={fileInputRef}
            type="file"
            id="menuImage"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />

          {preview ? (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 p-4">
              <img
                src={preview}
                alt="Dish preview"
                className="h-24 w-32 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {file?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
                <div className="mt-2 flex gap-3">
                  <label
                    htmlFor="menuImage"
                    className="cursor-pointer text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                  >
                    Replace
                  </label>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <label
              htmlFor="menuImage"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                selectFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                errors.image
                  ? "border-red-300 bg-red-50/40"
                  : "border-gray-200 hover:border-yellow-400 hover:bg-yellow-50/40"
              }`}
            >
              <ImagePlus className="h-8 w-8 text-gray-400" />
              <span className="mt-3 text-sm font-medium text-gray-700">
                Click to upload or drag and drop
              </span>
              <span className="mt-1 text-xs text-gray-400">
                JPG, PNG or WebP &middot; up to 5 MB
              </span>
            </label>
          )}

          <FieldError field="image" />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-7 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-yellow-600 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? "Adding..." : "Add menu item"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin/menus")}
          className="rounded-xl border border-gray-200 px-7 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddMenu;
