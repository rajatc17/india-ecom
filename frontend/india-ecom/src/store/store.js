import { configureStore } from "@reduxjs/toolkit";
import  productReducer from './product/productSlice'
import categoryReducer from './category/categorySlice'

const store = configureStore({
    reducer : {
        products : productReducer,
        categories : categoryReducer
    }
})

export default store;