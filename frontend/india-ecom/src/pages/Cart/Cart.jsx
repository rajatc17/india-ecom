import { useEffect } from 'react';
import { Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, removeFromCart, updateCartItem } from '../../store/cart/cartSlice';

const getProductId = (item) => item?.product?._id || item?.product;

const getProductSlug = (item) =>
  item?.slug || item?.product?.slug || item?.productDetails?.slug;

const getImageUrl = (item) => {
  const direct = typeof item?.image === 'string' ? item.image : item?.image?.url;
  return (
    direct ||
    item?.product?.images?.[0]?.url ||
    item?.productDetails?.images?.[0]?.url ||
    null
  );
};

const getUnitPrice = (item) => item?.discountedPrice || item?.price || 0;

const getMaxStock = (item) =>
  item?.availableStock ?? item?.product?.stock ?? item?.productDetails?.stock ?? 99;

const Cart = () => {
  const dispatch = useDispatch();
  const { items, totalItems, subtotal, total, loading, error } = useSelector(
    (state) => state.cart
  );

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleRemove = (item) => {
    const productId = getProductId(item);
    if (!productId) return;
    dispatch(removeFromCart(productId));
  };

  const handleDecrease = (item) => {
    const productId = getProductId(item);
    if (!productId) return;

    const currentQty = item?.quantity || 1;
    const nextQty = Math.max(1, currentQty - 1);
    if (nextQty === currentQty) return;

    dispatch(updateCartItem({ productId, quantity: nextQty }));
  };

  const handleIncrease = (item) => {
    const productId = getProductId(item);
    if (!productId) return;

    const currentQty = item?.quantity || 1;
    const maxStock = getMaxStock(item);
    const nextQty = Math.min(maxStock, currentQty + 1);
    if (nextQty === currentQty) return;

    dispatch(updateCartItem({ productId, quantity: nextQty }));
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Your Cart</h1>
          <p className="text-sm text-gray-500 mt-1">Review items and update quantities.</p>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
        >
          Continue shopping
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">
                Items <span className="text-gray-500">({totalItems || items?.length || 0})</span>
              </div>
              {loading && (
                <div className="text-xs text-gray-500">Updating…</div>
              )}
            </div>

            {!items || items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Your cart is empty.</p>
                <Link
                  to="/"
                  className="inline-block mt-4 px-5 py-2 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  const productId = getProductId(item);
                  const slug = getProductSlug(item);
                  const img = getImageUrl(item);
                  const unitPrice = getUnitPrice(item);
                  const qty = item?.quantity || 1;
                  const lineTotal = item?.subtotal ?? unitPrice * qty;
                  const maxStock = getMaxStock(item);

                  return (
                    <div
                      key={item?._id || productId}
                      className="p-4 sm:p-6 flex gap-4"
                    >
                      <div className="w-20 h-20 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                        {img ? (
                          <img
                            src={img}
                            alt={item?.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {slug ? (
                              <Link
                                to={`/product/${slug}`}
                                className="text-sm sm:text-base font-semibold text-gray-900 hover:text-amber-700 transition-colors line-clamp-2"
                              >
                                {item?.name}
                              </Link>
                            ) : (
                              <div className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">
                                {item?.name}
                              </div>
                            )}

                            <div className="mt-1 text-xs text-gray-500">
                              Unit price: ₹{unitPrice.toLocaleString()}
                            </div>

                            {item?.inStock === false && (
                              <div className="mt-2 text-xs font-medium text-red-600">
                                Out of stock
                              </div>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-gray-900">
                              ₹{Number(lineTotal).toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemove(item)}
                              className="mt-2 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleDecrease(item)}
                              className="px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              disabled={loading || qty <= 1}
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <div className="px-4 py-2 text-sm font-medium text-gray-900">
                              {qty}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleIncrease(item)}
                              className="px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              disabled={loading || qty >= maxStock}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-xs text-gray-500">
                            {Number.isFinite(maxStock) ? `Max: ${maxStock}` : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900">Order Summary</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-medium text-gray-900">{totalItems || items?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">₹{Number(subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total</span>
                <span className="text-lg font-semibold text-gray-900">₹{Number(total || subtotal || 0).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 w-full px-4 py-3 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
              disabled={!items || items.length === 0}
            >
              Checkout (coming soon)
            </button>

            <div className="mt-3 text-xs text-gray-500">
              Taxes and shipping are calculated at checkout.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cart;
