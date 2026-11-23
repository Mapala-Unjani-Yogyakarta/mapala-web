/** Kerangka yang muncul seketika saat berpindah halaman publik. */
export default function PublicLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Memuat halaman…</span>
      <div className="bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 pb-24 pt-32 sm:pt-40">
        <div className="container-page">
          <div className="skeleton mb-4 h-3 w-24 !bg-white/50" />
          <div className="skeleton h-14 w-3/4 max-w-xl !bg-white/50 sm:h-20" />
          <div className="skeleton mt-5 h-4 w-72 max-w-full !bg-white/40" />
        </div>
      </div>
      <div className="container-page grid gap-6 pt-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton aspect-[4/3] !rounded-card" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
