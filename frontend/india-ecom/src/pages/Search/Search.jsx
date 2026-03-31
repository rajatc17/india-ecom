import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchSearchProducts } from "../../store/product/productSlice";
import ProductCard from "../../components/ProductCard";
import Loader from "../../components/Loader";

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    searchItems,
    searchLoading,
    searchError,
    searchQuery,
    searchPagination,
  } = useSelector((state) => state.products);

  const params = new URLSearchParams(location.search);
  const query = params.get("q") || "";

  useEffect(() => {
    if (!query.trim()) return;
    dispatch(fetchSearchProducts({ q: query.trim(), page: 1, limit: 20 }));
  }, [dispatch, query]);

  return (
    <div className="w-full shilpika-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Search results
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              {query ? (
                <>
                  Showing results for "<span className="font-semibold">{query}</span>"
                </>
              ) : (
                "Enter a search term to discover products."
              )}
            </p>
          </div>
          {query && (
            <div className="text-sm text-gray-500">
              {searchPagination?.total || searchItems?.length || 0} items
            </div>
          )}
        </div>

        {searchError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchError?.message || searchError}
          </div>
        )}

        <div className="mt-6">
          {searchLoading && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Loader />
              Searching products...
            </div>
          )}

          {!searchLoading && query && searchItems?.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              No products found. Try a different keyword.
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(searchItems || []).map((product) => (
              <div
                key={product._id}
                onClick={() => navigate(`/product/${product.slug}`)}
                className="cursor-pointer"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
