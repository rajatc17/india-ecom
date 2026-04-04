import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ProductCard, { ProductCardSkeleton } from "../../components/ProductCard";
import Loader from "../../components/common/Loader";
import { CURATED_COLLECTIONS } from "../Home/components/heroCampaigns";
import { api } from "../../api/client";

const CuratedCollection = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 16 });

  const collection = useMemo(() => {
    if (!slug) return null;
    return CURATED_COLLECTIONS[slug] || null;
  }, [slug]);

  useEffect(() => {
    if (!collection) {
      return;
    }

    let isMounted = true;

    const loadCollection = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: "1",
          ...(collection.filters || {}),
        });
        const data = await api(`/api/products?${params.toString()}`);

        if (!isMounted) {
          return;
        }

        setProducts(data.products || []);
        setPagination(data.pagination || { total: 0, page: 1, pages: 1, limit: Number(collection.filters?.limit || 16) });
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError?.message || "Failed to load curated products");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCollection();

    return () => {
      isMounted = false;
    };
  }, [collection]);

  if (!collection) {
    return (
      <div className="w-full shilpika-bg min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-xl text-center rounded-3xl border border-amber-200 bg-white/80 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-800">Collection</p>
          <h1 className="mt-3 shilpika-heading text-3xl text-emerald-900">Collection not found</h1>
          <p className="mt-3 text-sm text-amber-900/80">
            This curated page is not available right now.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-[#C5663E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#B35835] transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full shilpika-bg">
      <section className="border-b border-amber-200/70 bg-gradient-to-r from-amber-50/80 via-[#f8f4e9]/90 to-emerald-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-12">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-800">Curated Collection</p>
          <h1 className="mt-3 shilpika-heading text-3xl sm:text-4xl md:text-5xl text-emerald-900 max-w-3xl">
            {collection.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-amber-900/85 max-w-3xl">{collection.subtitle}</p>
          <p className="mt-2 text-sm text-amber-900/70 max-w-3xl">{collection.description}</p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-white/70 px-4 py-2 text-xs text-amber-900/80">
            <span>Showing</span>
            <span className="font-semibold">{pagination?.total || products?.length || 0}</span>
            <span>products</span>
            <span>from</span>
            <span className="font-semibold">{collection.highlightTag}</span>
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
                Loading curated products...
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <ProductCardSkeleton key={`curated-skeleton-${idx}`} variant="home" shimmerDelayMs={idx * 60} />
                ))}
              </div>
            </div>
          )}

          {!loading && (products?.length ?? 0) === 0 && (
            <div className="rounded-xl border border-amber-200 bg-white/70 p-6 text-sm text-amber-900/80">
              No products found for this collection right now. Try another curated page.
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(products || []).map((product) => (
              <div
                key={product._id}
                onClick={() => navigate(`/product/${product.slug}`)}
                className="cursor-pointer"
              >
                <ProductCard product={product} variant="home" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CuratedCollection;
