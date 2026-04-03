import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, removeFromCart, updateCartItem, selectCartItemsNewestFirst } from '../../store/cart/cartSlice';
import CartLineItem from '../../components/cart/CartLineItem';

const getProductId = (item) => item?.product?._id || item?.product;

const getMaxStock = (item) =>
  item?.availableStock ?? item?.product?.stock ?? item?.productDetails?.stock ?? 99;

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { totalItems, subtotal, total, loading, error } = useSelector(
    (state) => state.cart
  );
  const deletedItemMessage = useSelector((state) => state.cart.deletedItemMessage);
  const items = useSelector(selectCartItemsNewestFirst);

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

      {deletedItemMessage && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {deletedItemMessage}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-10 gap-6 items-start">
        <div className="md:col-span-7">
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

                  return (
                    <CartLineItem
                      key={item?._id || productId}
                      item={item}
                      loading={loading}
                      onRemove={handleRemove}
                      onDecrease={handleDecrease}
                      onIncrease={handleIncrease}
                      compactOnMobile
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-3">
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
              onClick={() => navigate('/checkout')}
              className="mt-6 w-full px-4 py-3 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
              disabled={!items || items.length === 0}
            >
              Proceed to Checkout
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
