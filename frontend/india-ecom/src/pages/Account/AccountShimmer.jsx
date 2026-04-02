const AccountShimmer = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 py-8">
    <div className="max-w-6xl mx-auto px-4">
      <div className="space-y-2 mb-6">
        <div className="account-shimmer h-8 w-52 rounded-md" />
        <div className="account-shimmer h-4 w-72 rounded-md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-orange-100 bg-white p-5 space-y-4">
          <div className="account-shimmer h-16 w-16 rounded-full" />
          <div className="account-shimmer h-5 w-2/3 rounded-md" />
          <div className="account-shimmer h-4 w-4/5 rounded-md" />
          <div className="account-shimmer h-10 w-full rounded-xl" />
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-orange-100 bg-white p-5 space-y-4">
          <div className="account-shimmer h-6 w-1/3 rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="account-shimmer h-24 rounded-xl" />
            <div className="account-shimmer h-24 rounded-xl" />
            <div className="account-shimmer h-24 rounded-xl" />
            <div className="account-shimmer h-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AccountShimmer;
