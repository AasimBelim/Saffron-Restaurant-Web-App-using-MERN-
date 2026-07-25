import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { ImagePlus, X } from "lucide-react";
import { toast } from "react-hot-toast";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const AddCategory = () => {
  const { axios, navigate, loading, setLoading, fetchCategories } =
    useContext(AppContext);
  const [name, setName] = useState("");
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
    if (!name.trim()) nextErrors.name = "Please enter a category name";
    else if (name.trim().length < 2) nextErrors.name = "Name looks too short";
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
      payload.append("name", name.trim());
      payload.append("image", file);

      const { data } = await axios.post("/api/category/add", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        toast.success(data.message);
        await fetchCategories();
        navigate("/admin/categories");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't add the category."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-lg font-bold text-gray-900">New category</h2>
      <p className="mt-1 text-sm text-gray-500">
        Categories group dishes on the menu page.
      </p>

      <div className="mt-7 space-y-6">
        <div>
          <label
            htmlFor="category-name"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Category name <span className="text-yellow-600">*</span>
          </label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="e.g. Desserts"
            aria-invalid={Boolean(errors.name)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:ring-4 ${
              errors.name
                ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                : "border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/15"
            }`}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-red-500">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">
            Category image <span className="text-yellow-600">*</span>
          </span>

          <input
            ref={fileInputRef}
            type="file"
            id="categoryImage"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />

          {preview ? (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 p-4">
              <img
                src={preview}
                alt="Category preview"
                className="h-24 w-24 rounded-lg object-cover"
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
                    htmlFor="categoryImage"
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
              htmlFor="categoryImage"
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

          {errors.image && (
            <p className="mt-1.5 text-xs font-medium text-red-500">
              {errors.image}
            </p>
          )}
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
          {loading ? "Adding..." : "Add category"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin/categories")}
          className="rounded-xl border border-gray-200 px-7 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddCategory;
