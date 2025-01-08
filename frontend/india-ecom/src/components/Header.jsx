import logo from '../assets/logoTP.png'
import logoSVG from '../assets/logoSVG.svg'
import { useState } from 'react';

const Header = () => {
  const [searchText, setSearchText] = useState()
  return (
    <header className="relative bg-terracotta px-8 py-12 overflow-hidden">
      {/* Texture overlay - now using custom utility */}
      <div className="absolute inset-0 bg-terracotta-texture opacity-30 pointer-events-none" />
      
      {/* Header content */}
      <div className="relative z-10 max-w-8xl mx-auto">
        <nav className="flex items-center justify-between px-10">
          <div className="">
            <img className='w-[150px] h-auto object-fill' src={logo} alt='Shilpika'/>
          </div>
          <div>
            <input type='text' />
          </div>
          <ul className="flex gap-8 text-gold-light">
            <li className="hover:text-gold transition cursor-pointer">Home</li>
            <li className="hover:text-gold transition cursor-pointer">Crafts</li>
            <li className="hover:text-gold transition cursor-pointer">Artisans</li>
            <li className="hover:text-gold transition cursor-pointer">About</li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;