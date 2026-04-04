import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router';
import { toggleWishlistItem } from '../../store/auth/authSlice';
import { addToCart } from '../../store/cart/cartSlice';
import { getProductPricing } from '../../utils/pricing';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { currentUser, loading } = useSelector((state) => state.auth);
  const wishlist = currentUser?.wishlist || [];

  const handleRemove = async (productId) => {
    try {
      await dispatch(toggleWishlistItem({ productId, isAdding: false })).unwrap();
    } catch {
      // Error handling
    }
  };

  const handleMoveToCart = async (product) => {
    try {
      await dispatch(addToCart({ product, quantity: 1 })).unwrap();
      await handleRemove(product._id);
    } catch {
      // Error handling
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen shilpika-bg shilpika-body text-gray-900 py-10 lg:py-14 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="h-10 w-48 bg-amber-100 rounded mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[3/4] bg-amber-50 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] shilpika-bg shilpika-body text-gray-900 py-10 lg:py-14">
      <div className="max-w-7xl 2xl:max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3 mb-10">
          <Heart className="text-emerald-900" size={28} />
          <h1 className="shilpika-heading text-3xl sm:text-4xl text-emerald-900">Your Wishlist</h1>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-amber-200/50 shadow-sm">
            <Heart className="mx-auto text-amber-200 mb-4" size={48} />
            <h2 className="text-xl sm:text-2xl text-emerald-900 font-medium mb-3">Your wishlist is empty</h2>
            <p className="text-amber-900/70 mb-8 max-w-md mx-auto">
              You haven't saved any items yet. Discover our handcrafted collection and find something beautiful to save for later.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-8 py-3.5 bg-emerald-900 text-white rounded-full text-sm font-semibold hover:bg-emerald-800 transition"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {wishlist.map((item) => {
              const product = item.product;
              if (!product) return null;
              
              const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
              const { originalPrice, effectivePrice, discountPercent, hasDiscount } = getProductPricing(product);
              const inStock = product.stock > 0;

              return (
                <div key={product._id} className="group relative flex flex-col bg-white rounded-3xl border border-amber-100 overflow-hidden shadow-sm hover:shadow-md transition">
                  <button 
                    onClick={() => handleRemove(product._id)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm hover:bg-white text-rose-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={16} />
                  </button>

                  <Link to={`/product/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden bg-amber-50">
                    {primaryImage ? (
                      <img 
                        src={primaryImage.url} 
                        alt={product.name} 
                        className="object-cover w-full h-full group-hover:scale-105 transition duration-700" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-900/30">No Image</div>
                    )}
                    {!inStock && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                         <span className="bg-white/90 px-4 py-1.5 rounded-full text-xs font-semibold text-rose-600 uppercase tracking-widest backdrop-blur-sm">
                           Out of Stock
                         </span>
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-3">
                      {product.giTag && (
                        <span className="inline-block px-2 lg:px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-semibold tracking-wider uppercase rounded-full mb-2 border border-amber-200/50">
                          GI Tag
                        </span>
                      )}
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="font-serif text-emerald-900 text-lg hover:text-[#C5663E] transition line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="mt-auto pt-4 border-t border-amber-100 flex items-center justify-between">
                      <div>
                        {hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-amber-700 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                            <span className="text-emerald-900 font-semibold">₹{effectivePrice.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-900 font-semibold">₹{effectivePrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleMoveToCart(product)}
                        disabled={!inStock}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-800 hover:bg-emerald-900 hover:text-white transition disabled:opacity-50 disabled:hover:bg-emerald-50 disabled:hover:text-emerald-800 shadow-sm"
                        title={inStock ? "Move to Cart" : "Out of Stock"}
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;