import logoNew from '../assets/logoNew.png';
import { useState  } from 'react';
import { createPortal } from 'react-dom'
import { IoSearch } from "react-icons/io5";
import { FaUserLarge } from "react-icons/fa6";
import { MdFavoriteBorder } from "react-icons/md";
import { PiHandbagBold } from "react-icons/pi";
import { Link, useNavigate } from 'react-router';
import LoginModal from './modal/LoginModal';
import { useSelector, useDispatch } from 'react-redux';
import { openLoginModal } from '../store/modal/modalSlice';
import FloatingCart from './FloatingCart';

const Header = () => {
  const [searchText, setSearchText] = useState()
  const [isCartHovered, setIsCartHovered] = useState(false);
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const isLoginModalOpen = useSelector((state) => state.modal.isLoginModalOpen);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleUserLogo = ()=>{
    if(isAuthenticated){
      navigate('/account');
      return;
    }
    
    dispatch(openLoginModal());
  }

  return (
    <>
    <header className="relative bg-white px-1 py-2 z-50">
      
      <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="grid grid-cols-3 items-center gap-4 py-2">
          
          <div className="flex justify-start">
            <div className='flex items-center gap-0.5 border border-gray-400 focus-within:border-black hover:border-amber-400 px-3 py-2 rounded-3xl transition-colors w-full max-w-xs'>
              <IoSearch className='text-zinc-950 flex-shrink-0' size={18} />
              <input 
                className='w-full rounded-2xl px-2 focus:outline-none bg-transparent' 
                type='text' 
                placeholder='Search' 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
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
                {<FloatingCart />}
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </header>
    {
      isLoginModalOpen && !isAuthenticated &&
      createPortal(<LoginModal />, document.body)
    }
    </>
  );
};

export default Header;
