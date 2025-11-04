import logoNew from '../assets/logoNew.png';
import { useState  } from 'react';
import { createPortal } from 'react-dom'
import { IoSearch } from "react-icons/io5";
import { FaUserLarge } from "react-icons/fa6";
import { MdFavoriteBorder } from "react-icons/md";
import { PiHandbagBold } from "react-icons/pi";
import { FaRegUser } from "react-icons/fa";
import { LuUserRound } from "react-icons/lu";
import { Link, useNavigate } from 'react-router';
import Modal from './Modal';

const Header = () => {
  const [searchText, setSearchText] = useState()
  const navigate = useNavigate()

  const handleUserLogo = ()=>{
    navigate('/login');
  }
  return (
    <>
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
            <li className="">
              <button className='cursor-pointer relative top-1' onClick={handleUserLogo}>
                <FaUserLarge size={20}/>
              </button>
            </li>
            <li className="">
              <button className='cursor-pointer'>
                <MdFavoriteBorder size={25}/>
              </button>
            </li>
            <li className="">
              <button className='cursor-pointer'>
                <PiHandbagBold size={24}/>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
    </>
  );
};

export default Header;