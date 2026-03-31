import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../../store/product/productSlice';
import ProductCard from '../../components/ProductCard';

const Category = () => {
    const { slug } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, items } = useSelector((state) => state.products)

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
    }, [dispatch, slug]);

    return (
        <div className='w-full relative shilpika-bg'>
            <div className='bg-amber-200 h-[200px] flex items-center justify-center'>
                <h1 className='text-4xl md:text-5xl font-bold text-gray-800'>
                    {categoryName}
                </h1>
            </div>
            <div className='size-full'>
                <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 mx-auto gap-5 my-10 px-4
                max-w-[clamp(20rem,90vw,100rem)]
                '>
                    {loading && Array.from({ length: 4 }).map((_, idx) => (
                        <div
                            key={`category-shimmer-${idx}`}
                            className='bg-white rounded-xl shadow-xs overflow-hidden'
                            style={{ '--shimmer-delay': `${idx * 80}ms` }}
                        >
                            <div className='category-card-shimmer h-[220px]' />
                            <div className='p-4 space-y-3'>
                                <div className='category-card-shimmer h-4 w-4/5 rounded-md' />
                                <div className='category-card-shimmer h-4 w-3/5 rounded-md' />
                                <div className='category-card-shimmer h-8 w-1/2 rounded-lg' />
                                <div className='category-card-shimmer h-10 w-full rounded-lg' />
                            </div>
                        </div>
                    ))}

                    {!loading && items && (items.length===0) ? 
                        <div>No Products Available...</div> :
                        !loading && items?.map((product) => 
                        <div key={product._id} onClick={() => navigate(`/product/${product.slug}`)}>
                            <ProductCard product={product}/>
                        </div>)
                    }
                </div>
            </div>
        </div>
    )
}

export default Category