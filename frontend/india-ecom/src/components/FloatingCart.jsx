import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router';
import { removeFromCart } from '../store/cart/cartSlice';
import { MdDeleteOutline } from "react-icons/md";

const FloatingCart = () => {
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const total = items?.reduce((acc, item) => acc + (item.subtotal || (item.price * item.quantity)), 0) || 0;

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
  };

  if (!items || items.length === 0) {
    return (
      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-[150] p-4 text-center">
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-[150] overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div key={item._id || item.product._id || item.product} className="flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <img 
              src={(typeof item.image === 'string' ? item.image : item.image?.url) || (item.product?.images?.[0]?.url)} 
              alt={item.name} 
              className="w-16 h-16 object-cover rounded-md"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              <p className="text-sm font-semibold text-amber-600">₹{item.subtotal?.toLocaleString() || (item.price * item.quantity).toLocaleString()}</p>
            </div>
            <button 
              onClick={() => handleRemove(item.product._id || item.product)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              aria-label="Remove item"
            >
              <MdDeleteOutline size={20} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600 font-medium">Total:</span>
          <span className="text-lg font-bold text-gray-900">₹{total.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link 
            to="/cart" 
            className="px-4 py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            View Cart
          </Link>
          <Link 
            to="/checkout" 
            className="px-4 py-2 text-sm font-medium text-center text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FloatingCart;
