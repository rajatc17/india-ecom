import React from 'react'
import { Award, MapPin, Star, Truck } from 'lucide-react';
import { getProductPricing } from '../utils/pricing';

const VARIANT_STYLES = {
  home: {
    mediaClass: 'aspect-[4/3] sm:aspect-[5/4]',
    titleClass: 'text-sm sm:text-base',
    showMaterialFallback: false,
    showShippingTag: false,
    showStockBadge: false,
    priceClass: 'text-sm sm:text-base',
    wrapperClass: 'rounded-xl',
  },
  category: {
    mediaClass: 'aspect-[4/3] sm:aspect-[5/4]',
    titleClass: 'text-sm sm:text-base',
    showMaterialFallback: true,
    showShippingTag: true,
    showStockBadge: true,
    priceClass: 'text-sm sm:text-base',
    wrapperClass: 'rounded-xl',
  },
  search: {
    mediaClass: 'aspect-[16/11] sm:aspect-[4/3]',
    titleClass: 'text-sm',
    showMaterialFallback: false,
    showShippingTag: true,
    showStockBadge: true,
    priceClass: 'text-sm',
    wrapperClass: 'rounded-lg',
  },
};

const ProductCard = ({ product, variant = 'category' }) => {
  const cardVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.category;

  const primaryImageUrl =
    product?.images?.find((img) => img?.isPrimary === true)?.url ||
    product?.images?.[0]?.url ||
    '';

  const { originalPrice, effectivePrice, discountPercent, hasDiscount } = getProductPricing(product);
  const giCertified = Boolean(product?.giTagged);
  const region = product?.region || '';
  const brand = product?.brand || '';
  const material = product?.material || '';
  const averageRating = Number(product?.averageRating || 0);
  const reviewCount = Number(product?.reviewCount || 0);
  const stock = Number(product?.stock || 0);
  const inStock = Boolean(product?.isAvailable !== false && stock > 0);
  const lowStock = inStock && stock <= Number(product?.lowStockThreshold || 5);
  const freeShipping = Boolean(product?.freeShipping);
  const supportingText = cardVariant.showMaterialFallback
    ? (brand || material || 'Artisan Collection')
    : (brand || 'Artisan Collection');

  return (
    <article className={`group bg-white h-full w-full overflow-hidden ${cardVariant.wrapperClass} border border-amber-100/80 shadow-xs hover:shadow-lg hover:border-amber-200 transition-all duration-300 cursor-pointer`}>
        <div className={`relative ${cardVariant.mediaClass} overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50`}>
            {hasDiscount ? (
              <div className='absolute right-2 top-2 z-10 rounded-full border border-red-200 bg-red-50 px-2 py-1'>
                <p className='text-[11px] sm:text-xs font-semibold text-red-700'>
                  {discountPercent}% OFF
                </p>
              </div>
            ) : null}

            {primaryImageUrl ? (
              <img
                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                src={primaryImageUrl}
                alt={product?.name || 'Product'}
                loading='lazy'
              />
            ) : (
              <div className='h-full w-full flex items-center justify-center text-sm text-amber-900/70'>
                Shilpika Selection
              </div>
            )}

            <div className='absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/45 to-transparent'>
              <div className='flex flex-wrap gap-1.5'>
                {giCertified ? (
                  <span className='inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50/95 px-2 py-0.5 text-[10px] font-medium text-amber-800'>
                    <Award size={11} />
                    GI
                  </span>
                ) : null}

                {region ? (
                  <span className='inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/95 px-2 py-0.5 text-[10px] font-medium text-emerald-800'>
                    <MapPin size={11} />
                    {region}
                  </span>
                ) : null}

                {cardVariant.showShippingTag && freeShipping ? (
                  <span className='inline-flex items-center gap-1 rounded-full border border-sky-200/80 bg-sky-50/95 px-2 py-0.5 text-[10px] font-medium text-sky-800'>
                    <Truck size={11} />
                    Free Shipping
                  </span>
                ) : null}
              </div>
            </div>
        </div>

        <div className='p-3 sm:p-4'>
          <p className={`${cardVariant.titleClass} font-semibold text-gray-900 leading-5 line-clamp-2 min-h-10`}>
            {product?.name || 'Untitled Product'}
          </p>

          <p className='mt-1 text-xs sm:text-sm text-gray-600 line-clamp-1'>
            {supportingText}
          </p>

          <div className='mt-2 flex items-center gap-2 flex-wrap'>
            <span className={`${cardVariant.priceClass} font-bold text-gray-900`}>₹{effectivePrice.toLocaleString('en-IN')}</span>
            {hasDiscount ? (
              <>
                <span className='text-xs sm:text-sm text-gray-500 line-through'>₹{originalPrice.toLocaleString('en-IN')}</span>
                <span className='text-[11px] font-semibold text-emerald-700'>Save {discountPercent}%</span>
              </>
            ) : null}
          </div>

          <div className='mt-2 flex items-center justify-between gap-2'>
            <div className='inline-flex items-center gap-1 text-[11px] sm:text-xs text-amber-800'>
              <Star size={12} className='fill-amber-500 text-amber-500' />
              <span className='font-medium'>{averageRating > 0 ? averageRating.toFixed(1) : 'New'}</span>
              <span className='text-gray-500'>({reviewCount})</span>
            </div>

            {cardVariant.showStockBadge ? (
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-medium border ${
                inStock
                  ? lowStock
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {inStock ? (lowStock ? `Only ${stock} left` : 'In stock') : 'Out of stock'}
              </span>
            ) : null}
          </div>
        </div>
    </article>
  )
}

export const ProductCardSkeleton = ({ variant = 'category', shimmerDelayMs = 0 }) => {
  const cardVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.category;

  return (
    <article
      className={`bg-white h-full w-full overflow-hidden ${cardVariant.wrapperClass} border border-amber-100/80 shadow-xs`}
      style={{ '--shimmer-delay': `${shimmerDelayMs}ms` }}
    >
      <div className={`${cardVariant.mediaClass} category-card-shimmer`} />

      <div className='p-3 sm:p-4 space-y-2.5'>
        <div className='category-card-shimmer h-4 w-4/5 rounded-md' />
        <div className='category-card-shimmer h-3 w-2/3 rounded-md' />

        <div className='flex items-center gap-2'>
          <div className='category-card-shimmer h-4 w-24 rounded-md' />
          <div className='category-card-shimmer h-3 w-16 rounded-md' />
        </div>

        <div className='flex items-center justify-between gap-2'>
          <div className='category-card-shimmer h-3 w-16 rounded-md' />
          {cardVariant.showStockBadge ? <div className='category-card-shimmer h-5 w-20 rounded-full' /> : null}
        </div>
      </div>
    </article>
  );
};

export default ProductCard