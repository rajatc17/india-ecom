import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../../store/product/productSlice';

const Category = () => {
    const { slug } = useParams();
    const dispatch = useDispatch();
    const products = useSelector((state)=>state.products.items)

    useEffect(() => {
        dispatch(fetchProducts({
            category: slug,
            page: 1,
            limit: 30
        }))
    }, [slug]);

    useEffect(()=>{
        console.log(products);
    }, [products])

    return (
        <div>
            HELLO
        </div>
    )
}

export default Category