import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProductBySlug } from '../../store/product/productSlice';
import Loader from '../../components/common/Loader';
import ImageCarousel from '../../components/ProductDetail/ImageCarousel';
import { ShoppingCart, Heart, Star, MapPin, Award, Package, Truck } from 'lucide-react';

const ProductDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentProduct, loading, error } = useSelector((state) => state.products);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
  }, [slug, dispatch]);

  if (loading) return <Loader fullScreen message="Loading product..." />;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;
  if (!currentProduct) return <div className="text-center py-20">Product not found</div>;

  const { name, description, price, images, category, region, giTag, stock, rating, reviews } = currentProduct;
  const primaryImage = images?.find((img) => img.isPrimary) || images?.[0];
  const inStock = stock > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image Carousel */}
          <div className="lg:sticky lg:top-8 h-fit">
            <ImageCarousel images={images} productName={name} />
          </div>

          {/* Right: Product Details */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Home</span>
              <span>/</span>
              <span>{category?.name}</span>
              <span>/</span>
              <span className="text-gray-900">{name}</span>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{name}</h1>
              {giTag && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Award size={20} />
                  <span className="font-medium">Geographical Indication Tag</span>
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(rating?.average || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {rating?.average?.toFixed(1)} ({rating?.count} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-indigo-600">₹{price.toLocaleString('en-IN')}</span>
                <span className="text-lg text-gray-500 line-through">₹{(price * 1.3).toLocaleString('en-IN')}</span>
                <span className="text-green-600 font-semibold">23% OFF</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Inclusive of all taxes</p>
            </div>

            {/* Region & Origin */}
            {region && (
              <div className="flex items-center gap-2 text-gray-700 bg-blue-50 rounded-lg p-4">
                <MapPin size={20} className="text-blue-600" />
                <span className="font-medium">Origin: {region}</span>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <Package size={20} className={inStock ? 'text-green-600' : 'text-red-600'} />
              <span className={`font-semibold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                {inStock ? `${stock} units available` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity Selector */}
            {inStock && (
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
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                disabled={!inStock}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              <button className="p-4 border-2 border-gray-300 rounded-xl hover:border-red-500 hover:text-red-500 transition">
                <Heart size={24} />
              </button>
            </div>

            {/* Delivery Info */}
            <div className="bg-green-50 rounded-xl p-4 flex items-start gap-3">
              <Truck size={24} className="text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-green-900">Free Delivery</p>
                <p className="text-sm text-green-700">Delivery in 3-5 business days across India</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
            </div>

            {/* Product Highlights */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Highlights</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span className="text-gray-700">100% Authentic Indian Product</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span className="text-gray-700">Sourced directly from {region || 'local artisans'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span className="text-gray-700">Quality assured and certified</span>
                </li>
                {giTag && (
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span className="text-gray-700">Protected under GI Tag certification</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
