import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../../store/product/productSlice';
import ProductCard from '../../components/ProductCard';
import Loader from '../../components/Loader';

const Category = () => {
    const { slug } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading , error, items} = useSelector((state)=>state.products)

    const categoryName = slug
        ?.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    useEffect(() => {
        dispatch(fetchProducts({
            category: slug,
            page: 1,
            limit: 30
        }))
    }, [slug]);

    return (
        <div className='w-full relative'>
            {loading && (
                <div className='fixed inset-0 z-50 bg-white/80 animate-pulse cursor-wait'></div>
            )}

            <div className='bg-amber-200 h-[200px] flex items-center justify-center'>
                <h1 className='text-4xl md:text-5xl font-bold text-gray-800'>
                    {categoryName}
                </h1>
            </div>
            <div className='size-full bg-black/5'>
                <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 mx-auto gap-5 my-10 px-4
                max-w-[clamp(20rem,90vw,100rem)]
                '>
                    {
                        items && (items.length===0) ? 
                        
                        <div> No Products Availble...</div> : 
                        
                        items?.map((product , i)=> 
                        <div key={product._id} onClick={()=>navigate(`/product/${product.slug}`)}>
                            <ProductCard product={product}/>
                        </div>)
                    }
                </div>
            </div>
        </div>
    )
}

export default Category