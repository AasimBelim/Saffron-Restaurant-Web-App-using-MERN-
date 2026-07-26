export default function NewsLetter() {
  return (
    <div className="w-full bg-slate-900 px-2 text-center text-white py-20 flex flex-col items-center justify-center">
      <p className="text-indigo-500 font-medium">Get updated</p>
      <h1 className="max-w-lg font-semibold text-4xl/[44px] mt-2">
        Subscribe to our newsletter & get the latest news
      </h1>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-600 bg-slate-950/80 p-2 text-sm max-w-xl mx-auto w-full focus-within:outline focus-within:outline-indigo-600">
        <input
          type="text"
          className="min-w-0 flex-1 rounded-full border border-transparent bg-transparent px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-slate-500"
          placeholder="Enter your email address"
        />
        <button className="shrink-0 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
          Subscribe now
        </button>
      </div>
    </div>
  );
}
