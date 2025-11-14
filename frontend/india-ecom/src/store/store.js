import { configureStore } from "@reduxjs/toolkit";
import  productReducer from './product/productSlice'
import categoryReducer from './category/categorySlice'
import authReducer from './auth/authSlice'
import modalReducer from './modal/modalSlice'

const store = configureStore({
    reducer : {
        products : productReducer,
        categories : categoryReducer,
        auth : authReducer,
        modal : modalReducer
    }
})

export default store;