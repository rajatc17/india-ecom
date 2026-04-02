import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../api/client';
import { getAddressDisplayLines } from '../../api/util';
import { fetchCart } from '../../store/cart/cartSlice';
import { useDispatch, useSelector } from 'react-redux';
import { downloadOrderInvoice } from './orderInvoice';

const ORDER_STATUS_META = {
  refunded: {
    title: 'Return complete',
    description: 'Your return is complete and refund has been initiated.',
    tone: 'border-red-200 bg-red-50',
    badge: 'text-red-700 bg-red-100',
  },
  cancelled: {
    title: 'Order cancelled',
    description: 'This order has been cancelled.',
    tone: 'border-red-200 bg-red-50',
    badge: 'text-red-700 bg-red-100',
  },
  delivered: {
    title: 'Delivered',
    description: 'Delivered successfully. Hope you love it.',
    tone: 'border-emerald-200 bg-emerald-50',
    badge: 'text-emerald-700 bg-emerald-100',
  },
  shipped: {
    title: 'Shipped',
    description: 'Your order is on the way.',
    tone: 'border-sky-200 bg-sky-50',
    badge: 'text-sky-700 bg-sky-100',
  },
  processing: {
    title: 'Processing',
    description: 'We are preparing your order for dispatch.',
    tone: 'border-amber-200 bg-amber-50',
    badge: 'text-amber-700 bg-amber-100',
  },
  confirmed: {
    title: 'Confirmed',
    description: 'Order confirmed and queued for packing.',
    tone: 'border-amber-200 bg-amber-50',
    badge: 'text-amber-700 bg-amber-100',
  },
  created: {
    title: 'Order placed',
    description: 'Your order has been placed successfully.',
    tone: 'border-amber-200 bg-amber-50',
    badge: 'text-amber-700 bg-amber-100',
  },
};

const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  upi: 'BHIM UPI',
  card: 'Card',
  wallet: 'Wallet',
  online: 'Online Payment',
};

const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

const GST_RATE = 0.18;

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatLongDate = (dateValue) => {
  if (!dateValue) return '-';
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return '-';
  return parsedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatAddress = (address = {}) => {
  const lines = getAddressDisplayLines(address);
  if (address?.country) {
    lines.push(address.country);
  }
  return lines;
};

const OrderDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state?.cart?.items || []);
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [buyingItemId, setBuyingItemId] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOrderDetails = async () => {
      if (!orderId) {
        if (isMounted) {
          setError('Order id is missing.');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await api(`/api/orders/${orderId}`);
        if (!isMounted) return;
        setOrder(data || null);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.error || err?.message || 'Unable to load order details.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrderDetails();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const items = Array.isArray(order?.items) ? order.items : [];
  const statusMeta = ORDER_STATUS_META[order?.status] || ORDER_STATUS_META.created;
  const addressLines = useMemo(() => formatAddress(order?.address || {}), [order?.address]);

  const itemSubtotal = Number(order?.subtotal || items.reduce((sum, item) => sum + Number(item?.subtotal || 0), 0));
  const marketplaceFee = Number(order?.shippingFee || 0);
  const includedIgst = itemSubtotal * (GST_RATE / (1 + GST_RATE));
  const discount = Number(order?.discount || 0);
  const total = Number(order?.total || itemSubtotal + marketplaceFee - discount);
  const refundAmount = order?.status === 'refunded' || order?.paymentStatus === 'refunded' ? total : null;

  const getItemProductId = (item) => {
    if (!item?.product) return '';
    if (typeof item.product === 'string') return item.product;
    return item.product._id || '';
  };

  const getCartItemProductId = (cartItem) => {
    if (!cartItem?.product) return '';
    if (typeof cartItem.product === 'string') return cartItem.product;
    return cartItem.product._id || '';
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    downloadOrderInvoice(order);
    setActionError('');
    setActionMessage('Invoice downloaded successfully.');
  };

  const handleBuyAgain = async (item) => {
    const productId = getItemProductId(item);

    if (!productId) {
      setActionMessage('');
      setActionError('Unable to add this item to cart. Product reference is missing.');
      return;
    }

    const itemAlreadyInCart = cartItems.some(
      (cartItem) => getCartItemProductId(cartItem) === productId
    );

    if (itemAlreadyInCart) {
      setActionError('');
      setActionMessage(`${item?.name || 'Item'} is already in your cart.`);
      return;
    }

    try {
      setBuyingItemId(productId);
      setActionError('');
      setActionMessage('');

      await api('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      await dispatch(fetchCart());
      setActionMessage(`${item?.name || 'Item'} added to cart.`);
    } catch (err) {
      setActionMessage('');
      setActionError(err?.message || err?.error || 'Failed to add item to cart.');
    } finally {
      setBuyingItemId('');
    }
  };

  const handleViewItem = (item) => {
    if (!item?.slug) {
      setActionMessage('');
      setActionError('Product page is unavailable for this item.');
      return;
    }

    navigate(`/product/${item.slug}`);
  };

  if (loading) {
    return (
      <section className="min-h-screen py-8 bg-gradient-to-br from-[#f6efe4] via-[#fff6e8] to-[#f9f2e7]">
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-white p-5 sm:p-6 space-y-3">
            <div className="account-shimmer h-4 w-48 rounded-md" />
            <div className="account-shimmer h-8 w-64 rounded-md" />
            <div className="account-shimmer h-5 w-80 rounded-md" />
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="account-shimmer h-28 rounded-xl" />
              <div className="account-shimmer h-28 rounded-xl" />
              <div className="account-shimmer h-28 rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="min-h-screen py-8 bg-gradient-to-br from-[#f6efe4] via-[#fff6e8] to-[#f9f2e7]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
            <h1 className="text-2xl font-bold text-red-800">Unable to load order</h1>
            <p className="mt-2 text-sm text-red-700">{error || 'Order was not found.'}</p>
            <Link
              to="/my-orders"
              className="mt-4 inline-flex px-4 py-2 rounded-lg border border-red-200 bg-white text-red-700 text-sm font-semibold hover:bg-red-100 transition"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen py-8 bg-gradient-to-br from-[#f6efe4] via-[#fff6e8] to-[#f9f2e7]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-2xl border border-amber-200/80 bg-white/95 shadow-sm p-5 sm:p-6 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-amber-100/60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-orange-100/50 blur-2xl" />

          <div className="text-sm text-amber-800/90">
            <Link to="/account" className="hover:text-amber-900 transition">Your Account</Link>
            <span className="mx-2 text-amber-400">›</span>
            <Link to="/my-orders" className="hover:text-amber-900 transition">Your Orders</Link>
            <span className="mx-2 text-amber-400">›</span>
            <span className="font-semibold text-amber-900">Order Details</span>
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl text-gray-900 shilpika-heading">Order Details</h1>
              <p className="mt-2 text-sm text-gray-700">
                Order placed {formatLongDate(order?.createdAt)}
                <span className="mx-2 text-gray-300">|</span>
                Order number {order?.orderNumber || order?._id}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="px-3 py-2 rounded-lg text-sm font-semibold border border-amber-200 text-amber-900 hover:bg-amber-50 transition"
            >
              Download Invoice
            </button>
          </div>

          {actionMessage ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {actionMessage}
            </div>
          ) : null}

          {actionError ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-amber-100 p-4 bg-[#fffdf8]">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Ship to</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{order?.address?.fullName || '-'}</p>
              {addressLines.map((line) => (
                <p key={line} className="text-sm text-gray-700">{line}</p>
              ))}
              <p className="text-sm text-gray-700">Phone: {order?.address?.phone || '-'}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Payment method</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{PAYMENT_METHOD_LABELS[order?.paymentMethod] || order?.paymentMethod || '-'}</p>
              <p className="mt-1 text-xs text-gray-600">
                Payment status: {PAYMENT_STATUS_LABELS[order?.paymentStatus] || order?.paymentStatus || '-'}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Order Summary</p>

              <div className="mt-2 space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-700">Item(s) Total (Incl. IGST):</span>
                  <span className="font-medium text-gray-900">{formatINR(itemSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-700">IGST Included (18%):</span>
                  <span className="font-medium text-gray-900">{formatINR(includedIgst)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-700">Marketplace Fees (0.1%):</span>
                  <span className="font-medium text-gray-900">{formatINR(marketplaceFee)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-700">Discount:</span>
                    <span className="font-medium text-emerald-700">- {formatINR(discount)}</span>
                  </div>
                ) : null}

                <div className="pt-1 border-t border-amber-100 flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-900">Grand Total:</span>
                  <span className="font-bold text-gray-900">{formatINR(total)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-900">Refund Total:</span>
                  <span className={`font-bold ${refundAmount ? 'text-gray-900' : 'text-gray-500'}`}>
                    {refundAmount ? formatINR(refundAmount) : 'Not initiated'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-4 rounded-2xl border ${statusMeta.tone} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}>
                {statusMeta.title}
              </div>
              <p className="mt-2 text-lg font-semibold text-gray-900">{statusMeta.title}</p>
              <p className="text-sm text-gray-700">{statusMeta.description}</p>
            </div>

            <div className="w-full sm:w-auto grid sm:block gap-2">
              <div className="w-full sm:w-auto px-5 py-2 rounded-full bg-[#EAC500] text-gray-900 text-sm font-semibold text-center">
                {statusMeta.title}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {items.map((item, index) => (
              <article
                key={`${item?.product || item?.slug || item?.name}-${index}`}
                className="rounded-xl border border-amber-100 bg-white p-4"
              >
                <div className="flex gap-3">
                  <div className="w-24 h-24 rounded-md border border-amber-100 bg-gray-50 overflow-hidden flex-shrink-0">
                    {item?.image ? (
                      <img src={item.image} alt={item?.name || 'Product'} className="w-full h-full object-cover" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    {item?.slug ? (
                      <Link
                        to={`/product/${item.slug}`}
                        className="text-lg leading-6 font-medium text-amber-900 hover:text-amber-700 transition"
                      >
                        {item?.name}
                      </Link>
                    ) : (
                      <p className="text-lg leading-6 font-medium text-amber-900">{item?.name || 'Product'}</p>
                    )}

                    <p className="mt-1 text-xs text-gray-600">Qty: {item?.qty || 1}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatINR(item?.subtotal || item?.unitPrice || 0)}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleBuyAgain(item)}
                        disabled={buyingItemId === getItemProductId(item)}
                        className="px-4 py-2 rounded-full bg-[#EAC500] hover:bg-[#D7B500] text-gray-900 text-sm font-semibold transition"
                      >
                        {buyingItemId === getItemProductId(item) ? 'Adding...' : 'Buy it again'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewItem(item)}
                        className="px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 transition"
                      >
                        View your item
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderDetails;