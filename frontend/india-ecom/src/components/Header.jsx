import logoSVG from '../assets/logoSVG.svg';
import logoNew from '../assets/logoNew.png';
import { useState } from 'react';
import { IoSearch } from "react-icons/io5";

const Header = () => {
  const [searchText, setSearchText] = useState()
  return (
    <header className="relative bg-white px-2 py-4 overflow-hidden shadow-xl">
      {/* Texture overlay - now using custom utility */}
      <div className="absolute inset-0 bg-terracotta-texture opacity-30 pointer-events-none" />
      
      {/* Header content */}
      <div className="relative z-10 max-w-8xl mx-auto">
        <nav className="flex items-center justify-between px-10">
          <div className='flex items-center gap-0.5 border-1 border-gray-500 focus:border-black hover:fill-amber-400  px-3 py-2 rounded-3xl shrink-1'>
            <IoSearch className='text-zinc-950' />
            <input className=' rounded-2xl px-2 focus:outline-none' type='text' placeholder='Search' value={searchText}/>
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