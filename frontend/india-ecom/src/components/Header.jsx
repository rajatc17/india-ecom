import logoSVG from '../assets/logoSVG.svg';
import logoNew from '../assets/logoNew.png';
import { useState } from 'react';

const Header = () => {
  const [searchText, setSearchText] = useState()
  return (
    <header className="relative bg-white px-2 py-4 overflow-hidden shadow-xl">
      {/* Texture overlay - now using custom utility */}
      <div className="absolute inset-0 bg-terracotta-texture opacity-30 pointer-events-none" />
      
      {/* Header content */}
      <div className="relative z-10 max-w-8xl mx-auto">
        <nav className="flex items-center justify-between px-10">
          <div>
            <input className=' rounded-2xl px-2' type='text' placeholder='Search' value={searchText}/>
          </div>
          <div className="">
            <img className='w-auto h-[80px] object-cover mx-auto' src={logoNew} alt='Shilpika'/>
          </div>
          <ul className="flex gap-8 text-black font-semibold">
            <li className="hover:text-gold transition cursor-pointer">LOGIN</li>
            <li className="hover:text-gold transition cursor-pointer">WISHLIST</li>
            <li className="hover:text-gold transition cursor-pointer">BAG</li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;