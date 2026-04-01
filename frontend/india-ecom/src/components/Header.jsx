import logoNew from '../assets/logoNew.png';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoSearch } from "react-icons/io5";
import { FaUserLarge } from "react-icons/fa6";
import { MdFavoriteBorder } from "react-icons/md";
import { PiHandbagBold } from "react-icons/pi";
import { HiBars3, HiXMark } from 'react-icons/hi2';
import { Link, useLocation, useNavigate } from 'react-router';
import LoginModal from './modal/LoginModal';
import { useSelector, useDispatch } from 'react-redux';
import { openLoginModal } from '../store/modal/modalSlice';
import FloatingCart from './FloatingCart';
import { api } from '../api/client';

const flattenCategories = (nodes = []) => {
  const result = [];
  nodes.forEach((node) => {
    result.push(node);
    if (Array.isArray(node.children) && node.children.length > 0) {
      result.push(...flattenCategories(node.children));
    }
  });
  return result;
};

const Header = ({ isCategoryMenuOpen = false, onToggleCategoryMenu = () => {} }) => {
  const headerRef = useRef(null);
  const location = useLocation();
  const [searchText, setSearchText] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [productMatches, setProductMatches] = useState([]);
  const [categoryMatches, setCategoryMatches] = useState([]);
  const categoryCacheRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const isLoginModalOpen = useSelector((state) => state.modal.isLoginModalOpen);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const isCheckoutRoute = location.pathname.startsWith('/checkout');

  const handleUserLogo = ()=>{
    if(isAuthenticated){
      navigate('/account');
      return;
    }
    
    dispatch(openLoginModal());
  }

  useEffect(() => {
    const query = searchText.trim();
    if (query.length < 2) {
      setProductMatches([]);
      setCategoryMatches([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const productsPromise = api(
          `/api/products?${new URLSearchParams({ q: query, limit: 6, sort: "-createdAt" }).toString()}`,
          { signal: controller.signal }
        );

        const categoriesPromise = categoryCacheRef.current
          ? Promise.resolve(categoryCacheRef.current)
          : api('/api/categories/tree?onlyWithProducts=true', { signal: controller.signal }).then((tree) => {
              const flattenedCategories = flattenCategories(tree || []);
              categoryCacheRef.current = flattenedCategories;
              return flattenedCategories;
            });

        const [productsResponse, categories] = await Promise.all([productsPromise, categoriesPromise]);

        if (!isActive) return;

        const filteredCategories = (categories || []).filter((cat) =>
          (cat?.name || '').toLowerCase().includes(query.toLowerCase())
        );

        setProductMatches(productsResponse?.products || []);
        setCategoryMatches(filteredCategories);
        setSearchLoading(false);
      } catch (error) {
        if (!isActive) return;
        if (error?.name === 'AbortError') return;
        setSearchLoading(false);
        setSearchError(error?.message || 'Failed to search');
      }
    }, 300);

    return () => {
      isActive = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchText]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;

    const updateHeaderHeightVar = () => {
      const measuredHeight = Math.ceil(headerRef.current?.getBoundingClientRect().height || 0);
      if (measuredHeight > 0) {
        document.documentElement.style.setProperty('--mobile-header-height', `${measuredHeight}px`);
      }
    };

    updateHeaderHeightVar();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateHeaderHeightVar);
      resizeObserver.observe(headerRef.current);
    }

    window.addEventListener('resize', updateHeaderHeightVar);

    return () => {
      window.removeEventListener('resize', updateHeaderHeightVar);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  const renderSearchBox = (wrapperClass = '') => (
    <div className={`relative ${wrapperClass}`}>
      <form
        className='flex items-center gap-0.5 border border-gray-400 focus-within:border-black hover:border-amber-400 px-3 py-2 rounded-3xl transition-colors w-full bg-white'
        onSubmit={(e) => {
          e.preventDefault();
          const query = searchText.trim();
          if (!query) return;
          setIsSearchOpen(false);
          navigate(`/search?q=${encodeURIComponent(query)}`);
        }}
      >
        <IoSearch className='text-zinc-950 flex-shrink-0' size={18} />
        <input
          className='w-full rounded-2xl px-2 focus:outline-none bg-transparent'
          type='text'
          placeholder='Search'
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsSearchOpen(false);
            }
          }}
          onFocus={() => {
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
            setIsSearchOpen(true);
          }}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => setIsSearchOpen(false), 150);
          }}
          aria-label="Search products"
        />
      </form>

      {isSearchOpen && searchText.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl border border-amber-200 bg-white shadow-lg z-50 overflow-hidden">
          {searchLoading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          )}

          {!searchLoading && searchError && (
            <div className="px-4 py-3 text-sm text-red-600">{searchError}</div>
          )}

          {!searchLoading && !searchError && categoryMatches.length > 0 && (
            <div className="px-4 pt-3">
              <div className="text-[11px] uppercase tracking-wide text-amber-800/70">Categories</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {categoryMatches.slice(0, 6).map((cat) => (
                  <button
                    key={cat._id || cat.slug}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate(`/category/${cat.slug}`);
                    }}
                    className="text-xs px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!searchLoading && !searchError && productMatches.length > 0 && (
            <div className="px-4 pb-3 pt-3">
              <div className="text-[11px] uppercase tracking-wide text-amber-800/70">Products</div>
              <div className="mt-2 space-y-2">
                {productMatches.slice(0, 6).map((product) => (
                  <button
                    key={product._id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate(`/product/${product.slug}`);
                    }}
                    className="w-full flex items-center gap-3 rounded-lg border border-transparent hover:border-amber-200 hover:bg-amber-50 p-2 text-left transition"
                  >
                    <img
                      src={product?.images?.[0]?.url}
                      alt={product?.name}
                      className="w-10 h-10 rounded-md object-cover bg-gray-100"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{product?.name}</div>
                      <div className="text-xs text-gray-500">₹{Number(product?.price || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!searchLoading && !searchError && categoryMatches.length === 0 && productMatches.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No matches found.</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
    <header ref={headerRef} className="relative bg-white px-1 py-2 z-50">
      {isCheckoutRoute ? (
        <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
          <nav className="py-2">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <Link to={'/'} aria-label="Go to homepage">
                  <img
                    className='w-auto h-[48px] sm:h-[56px] object-cover'
                    src={logoNew}
                    alt='Shilpika'
                  />
                </Link>
              </div>

              <div className="flex-1 flex justify-center px-3">
                <div className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-2 py-1">
                  {['Cart', 'Address', 'Payment'].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <span
                        className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${
                          index === 0 ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500'
                        }`}
                      >
                        {step}
                      </span>
                      {index < 2 && <span className="mx-1 text-gray-400">/</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-[48px] sm:w-[56px]" aria-hidden="true" />
            </div>
          </nav>
        </div>
      ) : (
      <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="py-2">
          <div className="md:hidden grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <div className="flex justify-start">
              <button
                type="button"
                className='p-2 rounded-lg border border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors'
                onClick={onToggleCategoryMenu}
                aria-expanded={isCategoryMenuOpen}
                aria-label='Toggle categories menu'
              >
                {isCategoryMenuOpen ? <HiXMark size={20} /> : <HiBars3 size={20} />}
              </button>
            </div>

            <div className="flex justify-center">
              <Link to={'/'}>
                <img
                  className='w-auto h-[56px] object-cover'
                  src={logoNew}
                  alt='Shilpika'
                />
              </Link>
            </div>

            <div className="flex justify-end">
              <ul className="flex gap-3 items-center">
                <li>
                  <button
                    className='cursor-pointer hover:text-amber-600 transition-colors'
                    onClick={handleUserLogo}
                    aria-label="User account"
                  >
                    <FaUserLarge size={20}/>
                  </button>
                </li>
                <li>
                  <button
                    className='cursor-pointer hover:text-amber-600 transition-colors'
                    aria-label="Wishlist"
                  >
                    <MdFavoriteBorder size={24}/>
                  </button>
                </li>
                <li
                  className="relative"
                  onMouseEnter={() => setIsCartHovered(true)}
                  onMouseLeave={() => setIsCartHovered(false)}
                >
                  <button
                    className='cursor-pointer hover:text-amber-600 transition-colors py-2'
                    aria-label="Shopping cart"
                  >
                    <PiHandbagBold size={23}/>
                  </button>
                  {isCartHovered && <FloatingCart />}
                </li>
              </ul>
            </div>
          </div>

          <div className="md:hidden mt-3">
            {renderSearchBox('w-full')}
          </div>

          <div className="hidden md:grid grid-cols-3 items-center gap-4">
            <div className="flex justify-start">
              {renderSearchBox('w-full max-w-xs')}
            </div>

            <div className="flex justify-center">
            <Link to={'/'}>
              <img 
                className='w-auto h-[60px] sm:h-[70px] lg:h-[80px] object-cover' 
                src={logoNew} 
                alt='Shilpika'
              />
            </Link>
          </div>

            <div className="flex justify-end">
              <ul className="flex gap-3 sm:gap-4 items-center">
                <li>
                  <button
                    className='cursor-pointer hover:text-amber-600 transition-colors'
                    onClick={handleUserLogo}
                    aria-label="User account"
                  >
                    <FaUserLarge size={20}/>
                  </button>
                </li>
                <li>
                  <button
                    className='cursor-pointer hover:text-amber-600 transition-colors'
                    aria-label="Wishlist"
                  >
                    <MdFavoriteBorder size={25}/>
                  </button>
                </li>
                <li
                  className="relative"
                  onMouseEnter={() => setIsCartHovered(true)}
                  onMouseLeave={() => setIsCartHovered(false)}
                >
                  <button
                    className='cursor-pointer hover:text-amber-600 transition-colors py-2'
                    aria-label="Shopping cart"
                  >
                    <PiHandbagBold size={24}/>
                  </button>
                  {isCartHovered && <FloatingCart />}
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
      )}
    </header>
    {
      isLoginModalOpen && !isAuthenticated &&
      createPortal(<LoginModal />, document.body)
    }
    </>
  );
};

export default Header;
