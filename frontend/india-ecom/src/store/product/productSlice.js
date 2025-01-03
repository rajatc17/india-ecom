import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchProducts = createAsyncThunk(
    'products/fetchAll',
    async (params = {} , {rejectWithValue}) => {
        try {

            const query = new URLSearchParams(params).toString();
            const req = await fetch(`http://localhost:5000/api/products?${query}`)

            const data = await req.json();

            return data;
        }
        catch(error){
            return rejectWithValue(error.response)
        }
    }
)

export const fetchFeaturedProducts = createAsyncThunk(
    'products/fetchFeatured',
    async ({ page = 1, limit = 8, sort = "-createdAt" } = {}, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams({ featured: true, page, limit, sort }).toString();
            const req = await fetch(`http://localhost:5000/api/products?${query}`);
            const data = await req.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.response);
        }
    }
);

export const fetchSearchProducts = createAsyncThunk(
    'products/fetchSearch',
    async ({ q, page = 1, limit = 20, sort = "-createdAt" } = {}, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams({ q, page, limit, sort }).toString();
            const req = await fetch(`http://localhost:5000/api/products?${query}`);
            const data = await req.json();
            return { ...data, q };
        } catch (error) {
            return rejectWithValue(error.response);
        }
    }
);

export const fetchProductBySlug = createAsyncThunk(
  'products/fetchBySlug',
  async (slug, { rejectWithValue }) => {
    try {
            const req = await fetch(`http://localhost:5000/api/products/slug/${slug}`)

            const data = await req.json();

            return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const productSlice = createSlice({
    name : 'products',
    initialState : {
        items : [],
        featuredItems: [],
        featuredLoading: false,
        featuredError: null,
        searchItems: [],
        searchLoading: false,
        searchError: null,
        searchQuery: "",
        searchPagination: {
            page: 1,
            limit: 20,
            total: 0,
            pages: 1
        },
        currentProduct: null,
        pagination : {
            page : 1,
            limit : 20,
            total : 0,
            pages : 1
        },
        loading : false,
        error : null,
    },
    reducers : {

    },
    extraReducers : (builder) =>{
        builder
            .addCase(fetchProducts.pending , (state) => {
                state.loading = true;
                state.error = null
            })
            .addCase(fetchProducts.fulfilled , (state, action) => {
                state.loading = false;
                state.items = action.payload.products;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchProducts.rejected , (state, action) => {
                state.loading = false;
                state.error = action.payload
            })
            .addCase(fetchFeaturedProducts.pending, (state) => {
                state.featuredLoading = true;
                state.featuredError = null;
            })
            .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
                state.featuredLoading = false;
                state.featuredItems = action.payload.products || [];
            })
            .addCase(fetchFeaturedProducts.rejected, (state, action) => {
                state.featuredLoading = false;
                state.featuredError = action.payload;
            })
            .addCase(fetchSearchProducts.pending, (state) => {
                state.searchLoading = true;
                state.searchError = null;
            })
            .addCase(fetchSearchProducts.fulfilled, (state, action) => {
                state.searchLoading = false;
                state.searchItems = action.payload.products || [];
                state.searchPagination = action.payload.pagination || state.searchPagination;
                state.searchQuery = action.payload.q || "";
            })
            .addCase(fetchSearchProducts.rejected, (state, action) => {
                state.searchLoading = false;
                state.searchError = action.payload;
            })
            .addCase(fetchProductBySlug.pending, (state) => {
                state.loading = true;
                state.error = null;
              })
              .addCase(fetchProductBySlug.fulfilled, (state, action) => {
                state.loading = false;
                state.currentProduct = action.payload;
              })
              .addCase(fetchProductBySlug.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
              });
    }
})

export default productSlice.reducer;