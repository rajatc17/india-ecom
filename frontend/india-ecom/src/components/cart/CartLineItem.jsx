import { Link } from 'react-router';
import { Award, MapPin, Trash2 } from 'lucide-react';

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatINR = (value) => INR_FORMATTER.format(Number(value || 0));

const getProductSlug = (item) => item?.slug || item?.product?.slug || item?.productDetails?.slug;

const getImageUrl = (item) => {
  const direct = typeof item?.image === 'string' ? item.image : item?.image?.url;
  return direct || item?.product?.images?.[0]?.url || item?.productDetails?.images?.[0]?.url || null;
};

const getUnitPrice = (item) => item?.discountedPrice || item?.price || 0;

const getMaxStock = (item) => item?.availableStock ?? item?.product?.stock ?? item?.productDetails?.stock ?? 99;

const getProductBrand = (item) => item?.brand || item?.product?.brand || item?.productDetails?.brand || '';

const getProductRegion = (item) => item?.region || item?.product?.region || item?.productDetails?.region || '';

const isGITagCertified = (item) => Boolean(
  item?.giTag ?? item?.giTagged ?? item?.product?.giTag ?? item?.product?.giTagged ?? item?.productDetails?.giTag ?? item?.productDetails?.giTagged
);

const CartLineItem = ({ item, loading, onRemove, onIncrease, onDecrease, compactOnMobile = false }) => {
  const slug = getProductSlug(item);
  const img = getImageUrl(item);
  const unitPrice = getUnitPrice(item);
  const qty = item?.quantity || 1;
  const maxStock = getMaxStock(item);
  const brand = getProductBrand(item);
  const region = getProductRegion(item);
  const giCertified = isGITagCertified(item);
  const stockBadge = maxStock <= 5 ? `Only ${maxStock} left` : 'In stock';
  const itemSubtotal = unitPrice * qty;
  const wrapperClass = compactOnMobile
    ? 'p-3 sm:p-6 flex gap-3 sm:gap-5'
    : 'p-4 sm:p-6 flex gap-4 sm:gap-5';
  const mediaWrapClass = compactOnMobile ? 'w-20 sm:w-28' : 'w-24 sm:w-28';
  const mediaClass = compactOnMobile
    ? 'w-20 h-20 sm:w-28 sm:h-28 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0'
    : 'w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0';

  return (
    <div className={wrapperClass}>
      <div className={mediaWrapClass}>
        <div className={mediaClass}>
          {img ? (
            <img src={img} alt={item?.name || 'Product'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(item)}
          className="mt-2 inline-flex items-center justify-center gap-1 w-full text-[11px] font-medium text-gray-500 hover:text-red-600 transition-colors"
          aria-label="Remove item"
        >
          <Trash2 size={12} />
          <span>Remove</span>
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            {slug ? (
              <Link
                to={`/product/${slug}`}
                className="text-sm sm:text-base font-semibold text-gray-900 hover:text-amber-700 transition-colors line-clamp-2"
              >
                {item?.name}
              </Link>
            ) : (
              <div className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">{item?.name}</div>
            )}

            {brand ? (
              <p className="mt-1 text-xs text-gray-500"><span className="font-medium text-gray-700">{brand}</span></p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {giCertified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] text-amber-800 font-medium">
                  <Award size={13} />
                  GI Tag Certified
                </span>
              ) : null}

              {region ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] text-emerald-800 font-medium">
                  <MapPin size={13} />
                  {region}
                </span>
              ) : null}

              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-[11px] font-medium">
                {stockBadge}
              </span>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Item subtotal: <span className="font-medium text-gray-700">{formatINR(itemSubtotal)}</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-sm font-semibold text-gray-900">{formatINR(unitPrice)}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">per item</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="inline-flex items-center rounded-md border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => onDecrease(item)}
              className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={loading || qty <= 1}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <div className="px-2 py-1 text-xs font-medium text-gray-900 min-w-7 text-center">{qty}</div>
            <button
              type="button"
              onClick={() => onIncrease(item)}
              className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={loading || qty >= maxStock}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CartLineItem;
