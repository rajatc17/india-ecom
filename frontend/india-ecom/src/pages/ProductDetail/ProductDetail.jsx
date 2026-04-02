import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProductBySlug } from '../../store/product/productSlice';
import Loader from '../../components/common/Loader';
import ImageCarousel from '../../components/ProductDetail/ImageCarousel';
import { ShoppingCart, Heart, Star, MapPin, Award, Package, Hand, BadgeCheck, Truck } from 'lucide-react';
import { addToCart, fetchCart } from '../../store/cart/cartSlice';
import ProductDetailShimmer from './ProductDetailShimmer';
import { getProductPricing } from '../../utils/pricing';

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.$oid) return String(value.$oid);
    if (value._id) return String(value._id);
  }
  return String(value);
};

const ProductDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProduct, loading, error } = useSelector((state) => state.products);
  const { items: cartItems = [], loading: cartLoading } = useSelector((state) => state.cart);
  const quantity = 1;
  const [activeTab, setActiveTab] = useState('details');
  const [addedLocally, setAddedLocally] = useState(false);

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
  }, [slug, dispatch]);

  useEffect(() => {
    setAddedLocally(false);
  }, [slug]);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const productId = currentProduct?._id;
  const isInCart = useMemo(() => {
    const normalizedProductId = normalizeId(productId);
    const normalizedSlug = String(slug || '');

    return cartItems.some((item) => {
      const itemProductId = normalizeId(item?.product?._id || item?.product || item?.productDetails?._id);
      const itemSlug = String(item?.slug || item?.product?.slug || item?.productDetails?.slug || '');

      const idMatches = normalizedProductId && itemProductId && itemProductId === normalizedProductId;
      const slugMatches = normalizedSlug && itemSlug && itemSlug === normalizedSlug;

      return Boolean(idMatches || slugMatches);
    });
  }, [cartItems, productId, slug]);

  const shouldShowGoToCart = isInCart || addedLocally;

  if (loading) return <ProductDetailShimmer />;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;
  if (!currentProduct) return <div className="text-center py-20">Product not found</div>;

  const { name, description, images, category, region, giTag, stock, rating, reviews } = currentProduct;
  const { originalPrice, effectivePrice, discountPercent, hasDiscount } = getProductPricing(currentProduct);
  const primaryImage = images?.find((img) => img.isPrimary) || images?.[0];
  const inStock = stock > 0;
  const shortDescription = description
    ? description.split('. ').slice(0, 2).join('. ') + (description.includes('.') ? '.' : '')
    : '';
  const reviewList = Array.isArray(reviews) ? reviews : [];

  const handleAddToCart = async () => {
    if(!inStock) return;
    try {
      await dispatch(addToCart({ product: currentProduct, quantity })).unwrap();
      setAddedLocally(true);
      dispatch(fetchCart());
    } catch {
      // Keep existing UI behavior on add failure.
    }
  };

  return (
    <div className="min-h-screen shilpika-bg shilpika-body text-gray-900">
      <div className="max-w-7xl 2xl:max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-xs sm:text-sm text-amber-900/70 flex flex-wrap items-center gap-2">
          <span className="hover:text-amber-900 transition">Home</span>
          <span>›</span>
          <span className="hover:text-amber-900 transition">{category?.name || 'Category'}</span>
          <span>›</span>
          <span className="text-amber-950/90">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 lg:gap-16">
          {/* Left: Image Carousel */}
          <div className="lg:sticky lg:top-8 h-fit">
            <ImageCarousel images={images} productName={name} />
          </div>

          {/* Right: Product Details */}
          <div className="space-y-7">
            {/* Product Title */}
            <div>
              <h1 className="shilpika-heading text-2xl sm:text-3xl lg:text-4xl text-emerald-900 leading-tight">
                {name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                {giTag && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                    <Award size={16} />
                    GI Tag Certified
                  </span>
                )}
                {region && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
                    <MapPin size={16} />
                    {region}
                  </span>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.floor(rating?.average || 0) ? 'fill-amber-400 text-amber-400' : 'text-amber-100'}
                  />
                ))}
              </div>
              <button className="text-sm text-amber-900/80 hover:text-amber-900 transition">
                {rating?.average?.toFixed(1) || '0.0'} ({rating?.count || 0} reviews)
              </button>
            </div>

            {/* Price */}
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-semibold text-emerald-900">₹{effectivePrice.toLocaleString('en-IN')}</span>
                {hasDiscount ? (
                  <>
                    <span className="text-sm text-amber-700 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                    <span className="text-xs font-semibold text-white bg-[#C5663E] px-2.5 py-1 rounded-full">{discountPercent}% OFF</span>
                  </>
                ) : null}
              </div>
              <p className="text-xs text-amber-900/70 mt-2">Inclusive of all taxes</p>
            </div>

            {/* Short Description */}
            {shortDescription && (
              <p className="text-sm sm:text-base text-amber-950/80 leading-relaxed">
                {shortDescription}
              </p>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2 text-sm">
              <Package size={18} className={inStock ? 'text-emerald-600' : 'text-red-600'} />
              <span className={`font-medium ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
                {inStock ? 'In stock' : 'Out of stock'}
              </span>
              {inStock && <span className="text-amber-900/70">({stock} available)</span>}
            </div>

            {/* Quantity Selector */}
            {/* {inStock && (
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            )} */}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                disabled={!inStock || cartLoading}
                className="w-full cursor-pointer bg-[#C5663E] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#B35835] transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={shouldShowGoToCart ? () => navigate('/cart') : handleAddToCart}
              >
                <ShoppingCart size={18} />
                {shouldShowGoToCart ? 'GO TO CART' : 'ADD TO CART'}
              </button>
              <button
                type="button"
                className="w-full border border-emerald-900/40 text-emerald-900 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-900 hover:text-white transition"
              >
                BUY NOW
              </button>
              <button className="flex items-center gap-2 text-sm text-amber-900/80 hover:text-amber-900 transition">
                <Heart size={18} />
                Add to Wishlist
              </button>
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-amber-950/80">
              <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-white/70 px-3 py-2">
                <Hand size={16} className="text-amber-700" />
                Handcrafted by Artisans
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-white/70 px-3 py-2">
                <BadgeCheck size={16} className="text-emerald-700" />
                Authentic Quality
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-white/70 px-3 py-2">
                <Truck size={16} className="text-[#C5663E]" />
                Free Shipping India
              </div>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <section className="mt-14 lg:mt-20 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div className="rounded-3xl overflow-hidden border border-amber-200 shadow-sm bg-white">
            {primaryImage?.url ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="aspect-[4/3] bg-amber-50" />
            )}
          </div>
          <div className="space-y-4">
            <h2 className="shilpika-heading text-2xl sm:text-3xl text-emerald-900">The Story Behind the Weave</h2>
            <p className="text-sm sm:text-base text-amber-950/80 leading-relaxed">
              Rooted in {region || 'Indian'} craftsmanship, this piece celebrates timeless artistry and patient handwork. Every detail is composed to honor tradition while feeling modern and wearable.
            </p>
            <p className="text-sm sm:text-base text-amber-950/80 leading-relaxed">
              From loom to wardrobe, each creation reflects heritage, technique, and the hands that shaped it.
            </p>
          </div>
        </section>

        {/* Tabs */}
        <section className="mt-14 lg:mt-20">
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'details', label: 'Product Details' },
              { id: 'care', label: 'Care Instructions' },
              { id: 'shipping', label: 'Shipping & Returns' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-900 text-white border-emerald-900'
                    : 'bg-white/80 text-emerald-900 border-emerald-900/20 hover:border-emerald-900/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-white/90 p-8 shadow-sm">
            {activeTab === 'details' && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-amber-950/80">
                <li><span className="font-medium">Category:</span> {category?.name || 'N/A'}</li>
                <li><span className="font-medium">Region:</span> {region || 'N/A'}</li>
                <li><span className="font-medium">GI Tag:</span> {giTag ? 'Yes' : 'No'}</li>
                <li><span className="font-medium">Availability:</span> {inStock ? 'In stock' : 'Out of stock'}</li>
                <li><span className="font-medium">Price:</span> ₹{effectivePrice.toLocaleString('en-IN')}</li>
                <li><span className="font-medium">Images:</span> {images?.length || 0}</li>
              </ul>
            )}

            {activeTab === 'care' && (
              <ul className="space-y-2 text-sm text-amber-950/80">
                <li>• Dry clean only to preserve texture and sheen.</li>
                <li>• Store in a muslin cloth away from direct sunlight.</li>
                <li>• Iron on low heat or use steam at a safe distance.</li>
              </ul>
            )}

            {activeTab === 'shipping' && (
              <ul className="space-y-2 text-sm text-amber-950/80">
                <li>• Dispatches within 24 hours.</li>
                <li>• Free shipping across India.</li>
                <li>• Easy 7-day returns on unused items.</li>
              </ul>
            )}
          </div>
        </section>

        {/* Curated Section */}
        <section className="mt-14 lg:mt-20">
          <h2 className="shilpika-heading text-2xl sm:text-3xl text-emerald-900">Curated Just For You</h2>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-white/80 p-8 text-sm text-amber-950/70">
            Recommendations tailored to this piece will appear here soon.
          </div>
        </section>

        {/* Reviews */}
        <section className="mt-14 lg:mt-20">
          <h2 className="shilpika-heading text-2xl sm:text-3xl text-emerald-900">Loved By Our Community</h2>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-white/90 p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-3xl font-semibold text-emerald-900">{rating?.average?.toFixed(1) || '0.0'}</div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.floor(rating?.average || 0) ? 'fill-amber-400 text-amber-400' : 'text-amber-100'}
                  />
                ))}
              </div>
              <div className="text-sm text-amber-950/70">Based on {rating?.count || 0} reviews</div>
            </div>

            <div className="mt-4 space-y-4">
              {reviewList.length === 0 ? (
                <p className="text-sm text-amber-950/70">No reviews yet. Be the first to share your experience.</p>
              ) : (
                reviewList.slice(0, 3).map((review, index) => (
                  <div key={review._id || index} className="border-t border-amber-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-900">{review?.user?.name || 'Customer'}</span>
                      <span className="text-xs text-amber-950/60">{review?.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    <p className="mt-2 text-sm text-amber-950/80">{review?.comment || review?.text || 'Lovely craftsmanship and quality.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
