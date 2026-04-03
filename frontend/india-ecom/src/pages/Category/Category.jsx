import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../../store/product/productSlice';
import ProductCard, { ProductCardSkeleton } from '../../components/ProductCard';

const SORT_OPTIONS = {
    newest: 'Newest',
    priceLowToHigh: 'Price: Low to High',
    priceHighToLow: 'Price: High to Low',
    nameAZ: 'Name: A to Z',
    nameZA: 'Name: Z to A'
};

const HERO_THEMES = [
    {
        backgroundImage:
            'radial-gradient(circle at 14% 20%, rgba(251, 191, 36, 0.22), transparent 38%), radial-gradient(circle at 82% 24%, rgba(217, 119, 6, 0.22), transparent 36%), linear-gradient(130deg, #4a2f13 0%, #6b3f1c 48%, #7c4a1e 100%)',
        borderColor: 'rgba(251, 191, 36, 0.3)',
        glow: 'rgba(245, 158, 11, 0.2)',
    },
    {
        backgroundImage:
            'radial-gradient(circle at 85% 18%, rgba(244, 114, 182, 0.18), transparent 36%), radial-gradient(circle at 14% 72%, rgba(251, 191, 36, 0.16), transparent 40%), linear-gradient(140deg, #3f1f2b 0%, #5a2538 44%, #6b2e45 100%)',
        borderColor: 'rgba(244, 114, 182, 0.28)',
        glow: 'rgba(244, 114, 182, 0.2)',
    },
    {
        backgroundImage:
            'radial-gradient(circle at 24% 18%, rgba(45, 212, 191, 0.18), transparent 36%), radial-gradient(circle at 80% 74%, rgba(20, 184, 166, 0.2), transparent 38%), linear-gradient(145deg, #123534 0%, #0f4b49 46%, #0b5f5a 100%)',
        borderColor: 'rgba(45, 212, 191, 0.26)',
        glow: 'rgba(45, 212, 191, 0.18)',
    },
    {
        backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(96, 165, 250, 0.2), transparent 34%), radial-gradient(circle at 84% 24%, rgba(129, 140, 248, 0.2), transparent 36%), linear-gradient(140deg, #1e2a4f 0%, #25356b 44%, #2b4281 100%)',
        borderColor: 'rgba(129, 140, 248, 0.3)',
        glow: 'rgba(96, 165, 250, 0.2)',
    },
    {
        backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(163, 230, 53, 0.18), transparent 35%), radial-gradient(circle at 10% 80%, rgba(234, 179, 8, 0.16), transparent 38%), linear-gradient(145deg, #2a3d16 0%, #3e561d 44%, #4f6a23 100%)',
        borderColor: 'rgba(163, 230, 53, 0.25)',
        glow: 'rgba(190, 242, 100, 0.18)',
    },
];

const isValidSort = (value) => Object.prototype.hasOwnProperty.call(SORT_OPTIONS, value);

const Category = () => {
    const { slug } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { loading, items } = useSelector((state) => state.products)
    const initialSort = searchParams.get('sort');
    const [sortBy, setSortBy] = useState(isValidSort(initialSort) ? initialSort : 'newest');
    const [heroTheme, setHeroTheme] = useState(HERO_THEMES[0]);

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
        const randomIndex = Math.floor(Math.random() * HERO_THEMES.length);
        setHeroTheme(HERO_THEMES[randomIndex]);
    }, [slug]);

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
            <div
                className='relative h-[210px] md:h-[230px] flex items-center justify-center overflow-hidden border-b'
                style={{
                    backgroundImage: heroTheme.backgroundImage,
                    borderColor: heroTheme.borderColor,
                }}
            >
                <div
                    className='pointer-events-none absolute -bottom-16 left-1/2 h-44 w-[72%] -translate-x-1/2 rounded-full blur-3xl'
                    style={{ backgroundColor: heroTheme.glow }}
                />

                <div className='absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-black/20' />

                <h1 className='relative shilpika-heading text-3xl md:text-5xl font-bold text-amber-50 text-center tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]'>
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
                        <ProductCardSkeleton
                            key={`category-shimmer-${idx}`}
                            variant='category'
                            shimmerDelayMs={idx * 80}
                        />
                    ))}

                    {!loading && items && (items.length===0) ? 
                        <div>No Products Available...</div> :
                        !loading && sortedItems?.map((product) => 
                        <div key={product._id} onClick={() => navigate(`/product/${product.slug}`)} className='cursor-pointer'>
                            <ProductCard product={product} variant='category' />
                        </div>)
                    }
                </div>
            </div>
        </div>
    )
}

export default Category