import logoNew from '../assets/logoNew.png';
import { useState } from 'react';
import { IoSearch } from "react-icons/io5";
import { FaUserLarge } from "react-icons/fa6";
import { MdFavoriteBorder } from "react-icons/md";
import { PiHandbagBold } from "react-icons/pi";
import { FaRegUser } from "react-icons/fa";
import { LuUserRound } from "react-icons/lu";
import { Link } from 'react-router';

const Header = () => {
  const [searchText, setSearchText] = useState()
  return (
    <header className="relative bg-white px-1 py-2 overflow-hidden shadow-xl">
      {/* Texture overlay - now using custom utility */}
      <div className="absolute inset-0 bg-terracotta-texture opacity-30 pointer-events-none" />
      
      {/* Header content */}
      <div className="relative z-10 max-w-8xl mx-auto">
        <nav className="flex items-center justify-between px-10">
          
          <div className='flex items-center gap-0.5 border-1 border-gray-500 focus:border-black hover:fill-amber-400  px-3 py-2 rounded-3xl'>
            <IoSearch className='text-zinc-950' />
            <input className='w-6 rounded-2xl px-2 focus:outline-none' type='text' placeholder='Search' value={searchText}/>
          </div>
          
          <Link to={'/'}>
          <div className="" >
            <img className='w-auto h-[80px] object-cover mx-auto' src={logoNew} alt='Shilpika'/>
          </div>
          </Link>

          <ul className="flex gap-3 text-black font-semibold">
            <li className="hover:text-gold transition cursor-pointer">
              <FaUserLarge size={20} className='relative top-1'/>
            </li>
            <li className="hover:text-gold transition cursor-pointer">
              <MdFavoriteBorder size={25}/>
            </li>
            <li className="hover:text-gold transition cursor-pointer">
              <PiHandbagBold size={24}/>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;