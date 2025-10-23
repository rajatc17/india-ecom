import { createAsyncThunk , createSlice } from "@reduxjs/toolkit";

export const fetchCategories = createAsyncThunk(
    'categories/fetchAll',
    async (params = {} , {rejectWithValue}) => {
        try {

            const query = new URLSearchParams(params).toString();
            const req = await fetch(`http://localhost:5000/api/categories?${query}`)

            const data = await req.json();

            return data;
        }
        catch(error){
            return rejectWithValue(error.response)
        }
    }

)

export const fetchCategoryTree = createAsyncThunk(
    'categories/fetchTree',
    async (params = {} , {rejectWithValue}) => {
        try {

            const query = new URLSearchParams(params).toString();
            const req = await fetch(`http://localhost:5000/api/categories/tree`)

            const data = await req.json();

            return data;
        }
        catch(error){
            return rejectWithValue(error.response)
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
                state.error - null
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
                state.error - null
            })
            .addCase(fetchCategoryTree.fulfilled , (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCategoryTree.rejected , (state, action) => {
                state.loading = false;
                state.error = action.payload
            })
    }
})

export default categorySlice.reducer;