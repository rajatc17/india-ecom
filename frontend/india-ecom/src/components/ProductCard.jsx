import React from 'react'

const ProductCard = ({product}) => {
  return (
    <div className='basis-1/4 h-96 flex-col shadow-xl rounded-xl'>
        <div>
            <img className='w-full h-48 object-cover' src={ product.images.find((img) => img.isPrimary === true).url } />
        </div>
        <p>{product.name}</p>
        <p>{product.brand}</p>
    </div>
  )
}

export default ProductCard