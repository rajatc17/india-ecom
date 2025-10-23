import { useState, useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux'


const SHItemMenu = () =>{
  
}

const SHItem = ( {name} ) => {
  return (
    <div className=''>
      {name}
    </div>
  )
}

const SubHeader = () => {
  const categoryTree = useSelector((state) => state.categories.items)
  
  useEffect(()=>{
    console.log(categoryTree)
  },[categoryTree])

  return (
    <div className='flex gap-1 justify-between px-4 py-6 text-md'>
      {
        categoryTree && categoryTree.map((category,i) => <SHItem name={category.name} key={category.id}/>)
      }
    </div>
  )
}

export default SubHeader