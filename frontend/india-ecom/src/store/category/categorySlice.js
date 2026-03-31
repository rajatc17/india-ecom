import { createAsyncThunk , createSlice } from "@reduxjs/toolkit";
import { api } from "../../api/client";

export const fetchCategories = createAsyncThunk(
    'categories/fetchAll',
    async (params = {} , {rejectWithValue}) => {
        try {

            const query = new URLSearchParams(params).toString();
            const data = await api(`/api/categories${query ? `?${query}` : ''}`);

            return data;
        }
        catch(error){
            return rejectWithValue(error.message || 'Failed to fetch categories')
        }
    }

)

export const fetchCategoryTree = createAsyncThunk(
    'categories/fetchTree',
    async (params = {} , {rejectWithValue}) => {
        try {

            const query = new URLSearchParams(params).toString();
            const data = await api(`/api/categories/tree${query ? `?${query}` : ''}`);

            return data;
        }
        catch(error){
            return rejectWithValue(error.message || 'Failed to fetch category tree')
        }
    }

)

export const fetchCategorySlug = createAsyncThunk(
    'categories/fetchSlug',
    async (params = {} , {rejectWithValue}) => {
        try {

            const query = new URLSearchParams(params).toString();
            const data = await api(`/api/categories${query ? `?${query}` : ''}`);

            return data;
        }
        catch(error){
            return rejectWithValue(error.message || 'Failed to fetch category by slug')
        }
    }

)

const categorySlice = createSlice({
    name : 'categories',
    initialState : {
        items : [],
        loading : false,
        error : null,
    },
    reducers : {

    },
    extraReducers : (builder) =>{
        builder
            .addCase(fetchCategories.pending , (state) => {
                state.loading = true;
                state.error = null
            })
            .addCase(fetchCategories.fulfilled , (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCategories.rejected , (state, action) => {
                state.loading = false;
                state.error = action.payload
            })
            .addCase(fetchCategoryTree.pending , (state) => {
                state.loading = true;
                state.error = null
            })
            .addCase(fetchCategoryTree.fulfilled , (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCategoryTree.rejected , (state, action) => {
                state.loading = false;
                state.error = action.payload
            })
            .addCase(fetchCategorySlug.pending , (state) => {
                state.loading = true;
                state.error = null
            })
            .addCase(fetchCategorySlug.fulfilled , (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCategorySlug.rejected , (state, action) => {
                state.loading = false;
                state.error = action.payload
            })
    }
})

export default categorySlice.reducer;