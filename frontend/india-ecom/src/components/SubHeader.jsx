import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategoryTree } from "../store/category/categorySlice";
import { Link } from 'react-router';

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

const SubHeader = () => {
  const dispatch = useDispatch();
  const categoryTree = useSelector((state) => state.categories.items);
  const [category, setCategory] = useState(null);
  const [displayCategory, setDisplayCategory] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    dispatch(fetchCategoryTree());
  }, [dispatch]);


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

  return (
    <>

    <div className='hidden md:block lg:hidden'>
      
    </div>

    <div className='hidden lg:block sticky top-0 bg-white shadow-sm px-4 text-xs z-50' onMouseLeave={handleSHMouseLeave}>
      <ul className='relative flex gap-1 justify-between max-w-7xl mx-auto list-none'>
        {categoryTree && categoryTree.map((cat) =>
          <Link to={'/category/' + cat.slug}>
          <li
            key={cat.id}
            className={
              'px-2 py-3 font-light border-b-2 border-transparent transition-all duration-150 ease-in-out cursor-pointer ' +
              ((category?.id === cat.id) ? 'border-b-orange-400 text-orange-400' : 'hover:text-orange-400')
            }
            onMouseOver={() => handleCategoryHover(cat)}
          >
              <span className='text-center'>{cat.name.toUpperCase()}</span>
          </li>
          </Link>
        )}
        <SHCatNavMenu isHovered={isHovered} category={displayCategory} />
      </ul>
    </div>
    
    </>
  );
};

export default SubHeader;