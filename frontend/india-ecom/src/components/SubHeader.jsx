import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategoryTree } from "../store/category/categorySlice";
import { Link } from 'react-router';
import { HiChevronDown } from 'react-icons/hi2';

const SHCatNavMenu = ({ isHovered, category }) => {
  if (!category) return null;

  return (
    <div
      className={
        'absolute left-0 top-full w-full px-6 py-8 shadow-lg border-t transition-all duration-300 ease-in-out ' +
        (isHovered ? 'visible opacity-100 bg-white translate-y-0' : 'invisible opacity-0 -translate-y-2')
      }
      style={{ zIndex: 40 }}
    >
      <div className="grid grid-cols-4 gap-6 max-w-7xl mx-auto">
        {category.children.map((cat_lvl1) =>
          <div key={cat_lvl1.id}>
            <Link to={'/category/' + cat_lvl1.slug}>
              <h3 className='text-lg font-semibold mb-3'>{cat_lvl1.name}</h3>
            </Link> 
            <ul className='space-y-2 list-none'>
              {cat_lvl1.children?.map((cat_lvl2) =>
                <li key={cat_lvl2.id} className='text-sm font-light hover:text-orange-400 cursor-pointer'>
                  <Link to={'/category/' + cat_lvl2.slug}>
                    {cat_lvl2.name}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

const SubHeader = ({ isCategoryMenuOpen = false, onCloseCategoryMenu = () => {} }) => {
  const dispatch = useDispatch();
  const categoryTree = useSelector((state) => state.categories.items);
  const [category, setCategory] = useState(null);
  const [displayCategory, setDisplayCategory] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    dispatch(fetchCategoryTree({ onlyWithProducts: true }));
  }, [dispatch]);

  useEffect(() => {
    if (!isCategoryMenuOpen) {
      setExpandedCategoryId(null);
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCategoryMenuOpen]);


  useEffect(() => {
    if (category) {
      setDisplayCategory(category);
      setIsHovered(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    } else {
      setIsHovered(false);
      hideTimer.current = setTimeout(() => {
        setDisplayCategory(null);
      }, 300);
    }
    return () => hideTimer.current && clearTimeout(hideTimer.current);
  }, [category]);

  const handleSHMouseLeave = () => {
    setCategory(null);
  };

  const handleCategoryHover = (cat) => {
    setCategory(cat);
  };

  const handleMobileCategoryToggle = (catId) => {
    setExpandedCategoryId((current) => (current === catId ? null : catId));
  };

  return (
    <>

    {isCategoryMenuOpen && (
      <div className='fixed inset-0 z-[70] block lg:hidden' aria-modal="true" role="dialog">
        <button
          type='button'
          className='mobile-menu-backdrop absolute inset-0 bg-black/20 backdrop-blur-sm'
          onClick={onCloseCategoryMenu}
          aria-label='Close categories menu'
        />

        <div className='mobile-menu-panel absolute left-4 right-4 top-[calc(var(--mobile-header-height,108px)+8px)] rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden'>
          <ul className='max-h-[70vh] overflow-y-auto divide-y divide-gray-100'>
            {(categoryTree || []).map((cat) => {
              const isExpanded = expandedCategoryId === cat.id;

              return (
                <li key={cat.id} className='px-3 py-2'>
                  <div className='flex items-center gap-2'>
                    <Link
                      to={'/category/' + cat.slug}
                      className='min-w-0 flex-1 text-sm font-medium text-gray-900 truncate'
                      title={cat.name}
                      onClick={onCloseCategoryMenu}
                    >
                      {cat.name}
                    </Link>

                    {cat.children?.length > 0 && (
                      <button
                        type='button'
                        onClick={() => handleMobileCategoryToggle(cat.id)}
                        className='p-1 rounded-md text-gray-600 hover:bg-gray-100'
                        aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                      >
                        <HiChevronDown
                          size={18}
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {isExpanded && cat.children?.length > 0 && (
                    <ul className='mt-2 ml-2 space-y-2 border-l border-gray-200 pl-3'>
                      {cat.children.map((cat_lvl1) => (
                        <li key={cat_lvl1.id}>
                          <Link
                            to={'/category/' + cat_lvl1.slug}
                            className='block text-sm text-gray-700 truncate hover:text-orange-500'
                            title={cat_lvl1.name}
                            onClick={onCloseCategoryMenu}
                          >
                            {cat_lvl1.name}
                          </Link>

                          {cat_lvl1.children?.length > 0 && (
                            <ul className='mt-1 ml-2 space-y-1'>
                              {cat_lvl1.children.map((cat_lvl2) => (
                                <li key={cat_lvl2.id}>
                                  <Link
                                    to={'/category/' + cat_lvl2.slug}
                                    className='block text-xs text-gray-500 truncate hover:text-orange-500'
                                    title={cat_lvl2.name}
                                    onClick={onCloseCategoryMenu}
                                  >
                                    {cat_lvl2.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      )}

    <div className='hidden lg:block sticky top-0 shilpika-bg shadow-sm px-4 text-xs z-40' onMouseLeave={handleSHMouseLeave}>
      <ul className='relative flex gap-1 justify-between max-w-7xl mx-auto list-none'>
        {categoryTree && categoryTree.map((cat) => (
          <li
            key={cat.id}
            className={
              'px-2 py-3 font-light border-b-2 border-transparent transition-all duration-150 ease-in-out cursor-pointer ' +
              ((category?.id === cat.id) ? 'border-b-orange-400 text-orange-400' : 'hover:text-orange-400')
            }
            onMouseOver={() => handleCategoryHover(cat)}
          >
            <Link to={'/category/' + cat.slug}>
              <span className='text-center'>{cat.name.toUpperCase()}</span>
            </Link>
          </li>
        ))}
        <SHCatNavMenu isHovered={isHovered} category={displayCategory} />
      </ul>
    </div>
    
    </>
  );
};

export default SubHeader;