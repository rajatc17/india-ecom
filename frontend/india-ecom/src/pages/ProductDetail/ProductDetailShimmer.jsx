const ProductDetailShimmer = () => {
  return (
    <section className="min-h-screen shilpika-bg py-8 sm:py-10">
      <div className="max-w-7xl 2xl:max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="account-shimmer h-4 w-64 rounded-md" />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12">
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-3 sm:p-4">
            <div className="account-shimmer aspect-[4/3] w-full rounded-xl" />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="account-shimmer h-16 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-white/85 p-5 space-y-3">
              <div className="account-shimmer h-8 w-5/6 rounded-md" />
              <div className="account-shimmer h-4 w-1/2 rounded-md" />
              <div className="flex gap-2">
                <div className="account-shimmer h-6 w-24 rounded-full" />
                <div className="account-shimmer h-6 w-24 rounded-full" />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white/85 p-5 space-y-3">
              <div className="account-shimmer h-10 w-40 rounded-md" />
              <div className="account-shimmer h-3 w-28 rounded-md" />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white/85 p-5 space-y-3">
              <div className="account-shimmer h-4 w-full rounded-md" />
              <div className="account-shimmer h-4 w-4/5 rounded-md" />
              <div className="account-shimmer h-4 w-2/3 rounded-md" />
            </div>

            <div className="space-y-2">
              <div className="account-shimmer h-11 w-full rounded-xl" />
              <div className="account-shimmer h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-amber-200 bg-white/85 p-6 space-y-4">
          <div className="account-shimmer h-6 w-56 rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="account-shimmer h-4 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailShimmer;
