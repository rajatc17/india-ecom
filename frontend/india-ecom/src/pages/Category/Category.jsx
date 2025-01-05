import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../../store/product/productSlice';
import ProductCard from '../../components/ProductCard';

const Category = () => {
    const { slug } = useParams();
    const dispatch = useDispatch();
    const { loading , error, items} = useSelector((state)=>state.products)

    useEffect(() => {
        dispatch(fetchProducts({
            category: slug,
            page: 1,
            limit: 30
        }))
    }, [slug]);

    useEffect(()=>{
        console.log(items);
    }, [items])

    if(loading){
        return (
            <div>
                Loading Products...
            </div>
        )
    }

    return (
        <div className='w-full'>
            <div className='bg-amber-200 h-[200px]'>

            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 mx-auto gap-5 my-10 px-4
            max-w-[clamp(20rem,90vw,100rem)]
            '>
                {
                    items && (items.length===0) ? 
                    
                    <div> No Products Availble...</div> : 
                    
                    items.map((product , i)=> <ProductCard key={product._id} product={product} />)
                }
            </div>
        </div>
    )
}

export default Category