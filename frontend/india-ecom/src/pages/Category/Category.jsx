import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../../store/product/productSlice';
import ProductCard from '../../components/ProductCard';

const SORT_OPTIONS = {
    newest: 'Newest',
    priceLowToHigh: 'Price: Low to High',
    priceHighToLow: 'Price: High to Low',
    nameAZ: 'Name: A to Z',
    nameZA: 'Name: Z to A'
};

const isValidSort = (value) => Object.prototype.hasOwnProperty.call(SORT_OPTIONS, value);

const Category = () => {
    const { slug } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { loading, items } = useSelector((state) => state.products)
    const initialSort = searchParams.get('sort');
    const [sortBy, setSortBy] = useState(isValidSort(initialSort) ? initialSort : 'newest');

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

    useEffect(() => {
        const urlSort = searchParams.get('sort');
        const normalizedSort = isValidSort(urlSort) ? urlSort : 'newest';

        if (normalizedSort !== sortBy) {
            setSortBy(normalizedSort);
        }
    }, [searchParams, sortBy]);

    const handleSortChange = (event) => {
        const nextSort = event.target.value;
        setSortBy(nextSort);

        const nextParams = new URLSearchParams(searchParams);
        if (nextSort === 'newest') {
            nextParams.delete('sort');
        } else {
            nextParams.set('sort', nextSort);
        }

        setSearchParams(nextParams, { replace: true });
    };

    const sortedItems = useMemo(() => {
        if (!Array.isArray(items)) {
            return [];
        }

        const products = [...items];

        switch (sortBy) {
            case 'priceLowToHigh':
                return products.sort((a, b) => (a?.discountedPrice ?? a?.price ?? 0) - (b?.discountedPrice ?? b?.price ?? 0));
            case 'priceHighToLow':
                return products.sort((a, b) => (b?.discountedPrice ?? b?.price ?? 0) - (a?.discountedPrice ?? a?.price ?? 0));
            case 'nameAZ':
                return products.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
            case 'nameZA':
                return products.sort((a, b) => (b?.name || '').localeCompare(a?.name || ''));
            case 'newest':
            default:
                return products.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
        }
    }, [items, sortBy]);

    return (
        <div className='w-full relative shilpika-bg'>
            <div className='bg-amber-200 h-[200px] flex items-center justify-center'>
                <h1 className='text-4xl md:text-5xl font-bold text-gray-800'>
                    {categoryName}
                </h1>
            </div>
            <div className='size-full px-4 pt-8 pb-12'>
                <div className='mx-auto mb-5 flex items-center justify-end max-w-[clamp(20rem,90vw,100rem)]'>
                    <div className='flex items-center gap-3 bg-white/85 border border-amber-100 rounded-lg px-3 py-2 shadow-xs'>
                        <label htmlFor='category-sort' className='text-sm font-semibold text-gray-700'>
                            Sort
                        </label>
                        <select
                            id='category-sort'
                            value={sortBy}
                            onChange={handleSortChange}
                            className='text-sm bg-transparent outline-none text-gray-800 cursor-pointer'
                        >
                            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 mx-auto gap-5 max-w-[clamp(20rem,90vw,100rem)]'>
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
                        !loading && sortedItems?.map((product) => 
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