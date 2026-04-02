import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { api } from '../../api/client';
import { fetchCart } from '../../store/cart/cartSlice';
import { downloadOrderInvoice } from '../../pages/Orders/orderInvoice';

const ORDER_STATUS_META = {
  refunded: {
    title: 'Refunded',
    description: 'Your refund has been issued successfully.',
    primaryAction: 'View Return/Refund Status',
    tone: 'bg-red-50 border-red-200',
  },
  cancelled: {
    title: 'Cancelled',
    description: 'This order has been cancelled.',
    primaryAction: 'View Return/Refund Status',
    tone: 'bg-red-50 border-red-200',
  },
  delivered: {
    title: 'Delivered',
    description: 'Delivered successfully. Hope you love it.',
    primaryAction: 'Buy it again',
    tone: 'bg-emerald-50 border-emerald-200',
  },
  shipped: {
    title: 'Shipped',
    description: 'Your order is on the way.',
    primaryAction: 'Track Package',
    tone: 'bg-sky-50 border-sky-200',
  },
  processing: {
    title: 'Processing',
    description: 'We are preparing your order for dispatch.',
    primaryAction: 'Track Package',
    tone: 'bg-amber-50 border-amber-200',
  },
  confirmed: {
    title: 'Confirmed',
    description: 'Order confirmed and queued for packing.',
    primaryAction: 'Track Package',
    tone: 'bg-amber-50 border-amber-200',
  },
  created: {
    title: 'Order Placed',
    description: 'Your order has been placed successfully.',
    primaryAction: 'Track Package',
    tone: 'bg-amber-50 border-amber-200',
  },
};

const formatDate = (isoDate) => {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const getAddressLines = (address = {}) => {
  const lines = [];

  if (address?.line1) lines.push(address.line1);
  if (address?.line2) lines.push(address.line2);
  if (address?.landmark) lines.push(address.landmark);

  const cityStatePincode = [address?.city, address?.state, address?.pincode]
    .filter(Boolean)
    .join(', ');
  if (cityStatePincode) lines.push(cityStatePincode);

  if (address?.country) lines.push(address.country);
  if (address?.phone) lines.push(`Phone: ${address.phone}`);

  return lines;
};

const OrderTile = ({ order, compact = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = Array.isArray(order?.items) ? order.items : [];
  const statusMeta = ORDER_STATUS_META[order?.status] || ORDER_STATUS_META.created;
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [buyingItemId, setBuyingItemId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isShipToExpanded, setIsShipToExpanded] = useState(false);

  const itemPreview = compact ? items.slice(0, 1) : items.slice(0, 2);
  const hasHiddenItems = items.length > itemPreview.length;
  const visibleItems = isItemsExpanded ? items : itemPreview;
  const shipToAddressLines = getAddressLines(order?.address || {});

  const getItemProductId = (item) => {
    if (!item?.product) return '';
    if (typeof item.product === 'string') return item.product;
    return item.product._id || '';
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

  return (
    <article className={`rounded-2xl border ${statusMeta.tone} bg-white/90 p-4 sm:p-5 shadow-sm`}>
      <div className={`grid gap-3 text-xs ${compact ? 'sm:grid-cols-4' : 'sm:grid-cols-4'}`}>
        <div>
          <p className="uppercase tracking-wide text-gray-500 font-semibold">Order Placed</p>
          <p className="text-gray-800 mt-0.5 font-medium">{formatDate(order?.createdAt)}</p>
        </div>

        <div>
          <p className="uppercase tracking-wide text-gray-500 font-semibold">Total</p>
          <p className="text-gray-900 mt-0.5 font-semibold">{formatINR(order?.total)}</p>
        </div>

        <div className="relative">
          <p className="uppercase tracking-wide text-gray-500 font-semibold">Ship To</p>

          <button
            type="button"
            onClick={() => setIsShipToExpanded((prev) => !prev)}
            className="mt-0.5 inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 font-semibold transition"
          >
            <span>{order?.address?.fullName || '-'}</span>
            <span className="text-xs text-amber-700">{isShipToExpanded ? '▲' : '▼'}</span>
          </button>

          {isShipToExpanded ? (
            <div className="absolute left-0 top-full z-20 mt-1.5 w-[260px] rounded-md border border-amber-100 bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-gray-700 shadow-lg">
              {shipToAddressLines.length > 0 ? (
                shipToAddressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))
              ) : (
                <p>Address unavailable.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="sm:text-right">
          <p className="uppercase tracking-wide text-gray-500 font-semibold">Order
            <span className='text-black'>  #{order?.orderNumber || order?._id}</span></p>
          {/* <p className="text-gray-800 mt-0.5 font-medium">{order?.orderNumber || order?._id}</p> */}

          <div className="mt-1.5 flex items-center gap-2 sm:justify-end">
            <Link to={`/my-orders/${order?._id}`} className="text-amber-800 hover:text-amber-900 font-medium transition">
              View order details
            </Link>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="text-gray-500 hover:text-gray-700 font-medium transition"
            >
              Invoice
            </button>
          </div>
        </div>
      </div>

      {actionMessage ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-2xl leading-7 font-semibold text-gray-900">{statusMeta.title}</p>
          <p className="text-sm text-gray-600 mt-1">{statusMeta.description}</p>
        </div>

        {!compact ? (
          <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
            <button
              type="button"
              className="px-4 py-2 rounded-full text-sm font-semibold bg-[#EAC500] hover:bg-[#D7B500] text-gray-900 transition"
            >
              {statusMeta.primaryAction}
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {visibleItems.map((item, idx) => (
          <div key={`${item?.product || item?.name}-${idx}`} className="flex gap-3 items-start">
            <div className="w-16 h-16 rounded-md border border-amber-100 bg-gray-50 overflow-hidden flex-shrink-0">
              {item?.image ? <img src={item.image} alt={item?.name || 'Product'} className="w-full h-full object-cover" /> : null}
            </div>

            <div className="min-w-0 flex-1">
              {item?.slug ? (
                <Link to={`/product/${item.slug}`} className="text-sm text-amber-900 hover:text-amber-700 font-medium leading-5 transition">
                  {item?.name}
                </Link>
              ) : (
                <p className="text-sm text-amber-900 font-medium leading-5">{item?.name || 'Product'}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Qty: {item?.qty || 1}</p>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleBuyAgain(item)}
                  disabled={buyingItemId === getItemProductId(item)}
                  className="px-3 py-1.5 rounded-full border border-gray-300 text-gray-800 text-xs font-semibold hover:bg-gray-50 transition"
                >
                  {buyingItemId === getItemProductId(item) ? 'Adding...' : 'Buy it again'}
                </button>
                <button
                  type="button"
                  onClick={() => handleViewItem(item)}
                  className="px-3 py-1.5 rounded-full border border-gray-300 text-gray-800 text-xs font-semibold hover:bg-gray-50 transition"
                >
                  View your item
                </button>
              </div>
            </div>
          </div>
        ))}

        {hasHiddenItems ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsItemsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition"
            >
              {isItemsExpanded
                ? 'Show fewer items'
                : `Show all ${items.length} items`}
            </button>
          </div>
        ) : null}

        {compact && items.length > 0 ? (
          <div className="pt-2">
            <Link
              to={`/my-orders/${order?._id}`}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 transition"
            >
              View order details
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default OrderTile;
