import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ProductCard, { ProductCardSkeleton } from "../../components/ProductCard";
import Loader from "../../components/common/Loader";
import { api } from "../../api/client";

const REGION_TITLE_FALLBACK = "Regional Craft Collection";
const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "-averageRating", label: "Top rated" },
  { value: "-createdAt", label: "Newest first" },
  { value: "-discount", label: "Best discount" },
  { value: "price", label: "Price: Low to high" },
  { value: "-price", label: "Price: High to low" },
];

const RegionCollection = () => {
  const { regionKey } = useParams();
  const navigate = useNavigate();

  const [regions, setRegions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [giOnly, setGiOnly] = useState(false);
  const [sortBy, setSortBy] = useState("-averageRating");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: PAGE_SIZE });

  const activeRegion = useMemo(() => {
    if (!regionKey) return null;
    return regions.find((region) => region.key === regionKey) || null;
  }, [regionKey, regions]);

  const visiblePageNumbers = useMemo(() => {
    const totalPages = Number(pagination?.pages || 1);
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, currentPage - 3);
    const end = Math.min(totalPages, start + 6);
    const adjustedStart = Math.max(1, end - 6);

    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }, [currentPage, pagination?.pages]);

  useEffect(() => {
    let isMounted = true;

    const loadRegions = async () => {
      try {
        const data = await api("/api/products/regions?limit=30");
        if (!isMounted) return;
        setRegions(Array.isArray(data?.regions) ? data.regions : []);
      } catch {
        if (!isMounted) return;
        setRegions([]);
      }
    };

    loadRegions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [regionKey, giOnly, sortBy]);

  useEffect(() => {
    if (!regionKey) return;

    let isMounted = true;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          region: regionKey,
          page: String(currentPage),
          limit: String(PAGE_SIZE),
          sort: sortBy,
          inStock: "true",
        });

        if (giOnly) {
          params.set("gi", "true");
        }

        const data = await api(`/api/products?${params.toString()}`);
        if (!isMounted) return;

        setProducts(data?.products || []);
        setPagination(data?.pagination || { total: 0, page: 1, pages: 1, limit: PAGE_SIZE });
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError?.message || "Failed to load region products");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [currentPage, giOnly, regionKey, sortBy]);

  const regionTitle = activeRegion?.label || REGION_TITLE_FALLBACK;

  return (
    <div className="w-full shilpika-bg min-h-[70vh]">
      <section className="border-b border-amber-200/70 bg-gradient-to-r from-amber-50/80 via-[#f7f3e8]/90 to-emerald-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-12">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-800">Shop By Region</p>
          <h1 className="mt-3 shilpika-heading text-3xl sm:text-4xl md:text-5xl text-emerald-900 max-w-3xl">
            {regionTitle}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-amber-900/85 max-w-3xl">
            Discover region-rooted crafts and curated products selected for quality, availability, and cultural character.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setGiOnly((prev) => !prev)}
              className={`rounded-full px-4 py-2 text-sm border transition ${
                giOnly
                  ? "bg-emerald-900 text-white border-emerald-900"
                  : "bg-white text-emerald-900 border-emerald-200 hover:border-emerald-400"
              }`}
            >
              {giOnly ? "GI Tagged Only: On" : "GI Tagged Only"}
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-white/70 px-4 py-2 text-xs text-amber-900/80">
              <span>Showing</span>
              <span className="font-semibold">{pagination?.total || products?.length || 0}</span>
              <span>products</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-white/70 px-3 py-2 text-xs text-amber-900/80">
              <span className="uppercase tracking-[0.08em] text-[10px]">Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="bg-transparent text-sm text-amber-900 focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {regions.map((region) => (
              <Link
                key={region.key}
                to={`/regions/${region.key}`}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  region.key === regionKey
                    ? "bg-amber-900 text-amber-50 border-amber-900"
                    : "bg-white/80 text-amber-900 border-amber-200 hover:bg-amber-50"
                }`}
              >
                {region.label} · {region.count}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div>
              <div className="flex items-center gap-3 text-sm text-amber-900/80">
                <Loader />
                Loading regional products...
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <ProductCardSkeleton key={`region-skeleton-${idx}`} variant="home" shimmerDelayMs={idx * 55} />
                ))}
              </div>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-white/70 p-6 text-sm text-amber-900/80">
              No products found for this region with current filters.
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <div
                key={product._id}
                onClick={() => navigate(`/product/${product.slug}`)}
                className="cursor-pointer"
              >
                <ProductCard product={product} variant="home" />
              </div>
            ))}
          </div>

          {pagination?.pages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={loading || currentPage <= 1}
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm text-amber-900 transition hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {visiblePageNumbers.map((pageNumber) => {
                return (
                  <button
                    key={`region-page-${pageNumber}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`h-9 min-w-9 rounded-full border text-sm px-3 transition ${
                      currentPage === pageNumber
                        ? "bg-emerald-900 text-white border-emerald-900"
                        : "bg-white text-amber-900 border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(pagination.pages, page + 1))}
                disabled={loading || currentPage >= pagination.pages}
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm text-amber-900 transition hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RegionCollection;
