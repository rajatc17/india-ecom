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

const productSlice = createSlice({
    name : 'products',
    initialState : {
        items : [],
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
                state.error - null
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
    }
})

export default productSlice.reducer;