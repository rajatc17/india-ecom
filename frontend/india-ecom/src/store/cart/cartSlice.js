import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';

// Helper to get local cart
const getLocalCart = () => {
  try {
    const cart = localStorage.getItem('guest_cart');
    return cart ? JSON.parse(cart) : { items: [] };
  } catch (e) {
    return { items: [] };
  }
};

// Helper to save local cart
const saveLocalCart = (cart) => {
  localStorage.setItem('guest_cart', JSON.stringify(cart));
};

// Async Thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.isAuthenticated) {
      try {
        const response = await api('/api/cart');
        return response.cart;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    } else {
      return getLocalCart();
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ product, quantity = 1 }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    
    if (auth.isAuthenticated) {
      try {
        const response = await api('/api/cart/add', {
          method: 'POST',
          body: JSON.stringify({ productId: product._id, quantity })
        });
        return response.cart;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    } else {
      // Local cart logic
      const cart = getLocalCart();
      const existingItemIndex = cart.items.findIndex(item => item.product === product._id);
      
      const effectivePrice = product.discountedPrice || product.price;
      
      if (existingItemIndex > -1) {
        // Update existing
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
          return rejectWithValue(`Only ${product.stock} items available`);
        }
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].subtotal = effectivePrice * newQuantity;
      } else {
        // Add new
        if (quantity > product.stock) {
          return rejectWithValue(`Only ${product.stock} items available`);
        }
        cart.items.push({
          product: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0]?.url || null,
          price: product.price,
          discountedPrice: product.discountedPrice,
          quantity,
          subtotal: effectivePrice * quantity,
          // Store minimal product data needed for display
          productDetails: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            images: product.images,
            price: product.price,
            discountedPrice: product.discountedPrice,
            stock: product.stock
          }
        });
      }
      
      // Recalculate totals
      cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.total = cart.subtotal; // Add tax/shipping logic here if needed
      
      saveLocalCart(cart);
      return cart;
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ productId, quantity }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    
    if (auth.isAuthenticated) {
      try {
        const response = await api(`/api/cart/update/${productId}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity })
        });
        return response.cart;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    } else {
      const cart = getLocalCart();
      const itemIndex = cart.items.findIndex(item => item.product === productId);
      
      if (itemIndex === -1) return rejectWithValue('Item not found');
      
      const item = cart.items[itemIndex];
      
      const maxStock = item.productDetails?.stock || 99;
      
      if (quantity > maxStock) {
        return rejectWithValue(`Only ${maxStock} items available`);
      }
      
      item.quantity = quantity;
      const effectivePrice = item.discountedPrice || item.price;
      item.subtotal = effectivePrice * quantity;
      
      cart.totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      cart.subtotal = cart.items.reduce((sum, i) => sum + i.subtotal, 0);
      cart.total = cart.subtotal;
      
      saveLocalCart(cart);
      return cart;
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeItem',
  async (productId, { getState, rejectWithValue }) => {
    const { auth } = getState();
    
    if (auth.isAuthenticated) {
      try {
        const response = await api(`/api/cart/remove/${productId}`, {
          method: 'DELETE'
        });
        return response.cart;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    } else {
      const cart = getLocalCart();
      cart.items = cart.items.filter(item => item.product !== productId);
      
      cart.totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      cart.subtotal = cart.items.reduce((sum, i) => sum + i.subtotal, 0);
      cart.total = cart.subtotal;
      
      saveLocalCart(cart);
      return cart;
    }
  }
);

export const syncCart = createAsyncThunk(
  'cart/sync',
  async (_, { getState, dispatch }) => {
    const localCart = getLocalCart();
    if (localCart.items.length === 0) return;

    // Push all local items to server
    for (const item of localCart.items) {
      try {
        await api('/api/cart/add', {
          method: 'POST',
          body: JSON.stringify({ 
            productId: item.product, 
            quantity: item.quantity 
          })
        });
      } catch (e) {
        console.error('Failed to sync item:', item.name, e);
      }
    }
    
    // Clear local cart after sync
    localStorage.removeItem('guest_cart');
    
    // Fetch fresh server cart
    dispatch(fetchCart());
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalItems: 0,
    subtotal: 0,
    total: 0,
    loading: false,
    error: null,
    lastSynced: null
  },
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.subtotal = 0;
      state.total = 0;
      localStorage.removeItem('guest_cart');
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalItems = action.payload.totalItems || 0;
        state.subtotal = action.payload.subtotal || 0;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.subtotal = action.payload.subtotal;
        state.total = action.payload.total;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.subtotal = action.payload.subtotal;
        state.total = action.payload.total;
      })
      
      // Remove Item
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.subtotal = action.payload.subtotal;
        state.total = action.payload.total;
      });
  }
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
