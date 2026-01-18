import { configureStore } from "@reduxjs/toolkit";
import  productReducer from './product/productSlice'
import categoryReducer from './category/categorySlice'
import authReducer from './auth/authSlice'
import modalReducer from './modal/modalSlice'
import cartReducer from './cart/cartSlice'

const store = configureStore({
    reducer : {
        products : productReducer,
        categories : categoryReducer,
        auth : authReducer,
        modal : modalReducer,
        cart : cartReducer
    }
})

export default store;