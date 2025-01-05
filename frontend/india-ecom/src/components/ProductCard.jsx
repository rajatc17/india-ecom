import React from 'react'

const ProductCard = ({product}) => {
  return (
    <div className='aspect-[5/6] basis-1/4 h-auto w-full flex-col shadow-xs overflow-hidden'>
        <div className='relative h-[60%]'>
            {
              product.discount ? 
              <div className='absolute bg-white/50 p-1 rounded-full right-1'>
                <p className='text-xs lg:text-base font-semibold'>
                  -{product.discount}%
                </p>
              </div> :
              null
            }
            <img className='w-full max-h-full object-cover' src={ product.images.find((img) => img.isPrimary === true).url } />
        </div>
        <div className='px-4 md:text-sm lg:text-base my-1'>
          <p className='font-semibold'>{product.name}</p>
          <p className='font-light'>{product.brand}</p>
          <div>
            {product.discountedPrice ?
            <>
              <span className='font-semibold mr-2'>₹{product.discountedPrice}</span>
              <span className='font-extralight line-through'>₹{product.price}</span>
            </> :
            <span className='font-semibold'>₹{product.price}</span>
            }
          </div>
        </div>
    </div>
  )
}

export default ProductCard