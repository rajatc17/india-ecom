import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import Hero from "./components/Hero";
import { useSelector, useDispatch } from "react-redux";
import { fetchFeaturedProducts } from "../../store/product/productSlice";
import { fetchCategoryTree } from "../../store/category/categorySlice";
import ProductCard, { ProductCardSkeleton } from "../../components/ProductCard";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    featuredItems: products,
    featuredLoading: productsLoading,
  } = useSelector((state) => state.products);

  const {
    items: categoryTree,
    loading: categoriesLoading,
  } = useSelector((state) => state.categories);

  const topCategories = useMemo(() => {
    if (!Array.isArray(categoryTree)) return [];
    return categoryTree.slice(0, 8);
  }, [categoryTree]);
  
  useEffect(() => {
    if (!Array.isArray(categoryTree) || categoryTree.length === 0) {
      dispatch(fetchCategoryTree({ onlyWithProducts: true }) );
    }
  }, [dispatch, categoryTree]);

  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) {
      dispatch(
        fetchFeaturedProducts({ page: 1, limit: 8, sort: "-createdAt" })
      );
    }
  }, [dispatch, products]);

  return (
    <div className="w-full">
      <Hero />

      {/* Category Showcase */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Explore India’s Heritage
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-2">
                From everyday essentials to festival favourites — shop categories
                inspired by our crafts, regions, and traditions.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(categoriesLoading && topCategories.length === 0) &&
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-black/5 animate-pulse"
                />
              ))}

            {topCategories.map((cat) => (
              <Link
                key={cat._id || cat.id || cat.slug}
                to={`/category/${cat.slug}`}
                className="group rounded-xl border border-black/10 bg-white hover:bg-amber-50 transition-colors p-4 flex items-center gap-3"
              >
                <div className="shrink-0 size-10 rounded-full bg-amber-100 flex items-center justify-center text-lg">
                  <span aria-hidden>{cat.icon || "✦"}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-amber-700">
                    {cat.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Handpicked for you
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Featured This Week
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-2">
                Popular picks celebrating Indian artistry — ready to ship across
                India.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {productsLoading && (products?.length ?? 0) === 0 &&
              Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} variant="home" shimmerDelayMs={i * 70} />
              ))}

            {(products || []).slice(0, 8).map((product) => (
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

      {/* Pride / Story */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Made with Pride. Rooted in Bharat.
              </h2>
              <p className="text-gray-700 mt-4 leading-relaxed">
                Your home deserves stories — not just products. We bring you a
                curated showcase of Indian culture: craftsmanship, motifs,
                materials, and traditions that have lived through generations.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="font-semibold text-gray-900">Authentic</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Crafted with respect for origin and technique.
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="font-semibold text-gray-900">Pan-India</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Celebrate regions — from local clusters to your doorstep.
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="font-semibold text-gray-900">Curated</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Fewer, better products — chosen for quality.
                  </p>
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="font-semibold text-gray-900">Trustworthy</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Clear pricing, reliable delivery, easy shopping.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-8">
              <h3 className="text-xl font-bold text-gray-900">
                A webstore that feels like a mela
              </h3>
              <p className="text-gray-700 mt-3">
                Browse by category, discover new favourites, and bring home
                pieces that reflect Indian identity — bold, warm, and timeless.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="text-xs font-semibold bg-white/80 border border-black/10 px-3 py-1 rounded-full">
                  Handcrafted finds
                </span>
                <span className="text-xs font-semibold bg-white/80 border border-black/10 px-3 py-1 rounded-full">
                  Festive-ready picks
                </span>
                <span className="text-xs font-semibold bg-white/80 border border-black/10 px-3 py-1 rounded-full">
                  Regional stories
                </span>
                <span className="text-xs font-semibold bg-white/80 border border-black/10 px-3 py-1 rounded-full">
                  Modern Indian aesthetic
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
