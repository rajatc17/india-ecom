export const getProductPricing = (product = {}) => {
  const originalPrice = Number(product?.price || 0);
  const effectivePrice = Number(product?.discountedPrice || originalPrice);

  const computedDiscount =
    product?.discountedPrice && product?.price
      ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
      : 0;

  const discountPercent = Number(product?.discount || computedDiscount || 0);
  const hasDiscount = discountPercent > 0 && effectivePrice < originalPrice;

  return {
    originalPrice,
    effectivePrice,
    discountPercent,
    hasDiscount,
  };
};
