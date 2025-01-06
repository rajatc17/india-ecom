import { useState, useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategoryTree } from "../../../store/category/categorySlice";


const SHItemMenu = () =>{
  
}

const SHItem = ( {name} ) => {
  return (
    <div className=''>
      {name.toUpperCase()}
    </div>
  )
}

const SubHeader = () => {

  const dispatch = useDispatch();
  const categoryTree = useSelector((state) => state.categories.items)
  
  useEffect(()=>{
    dispatch(fetchCategoryTree())
  },[])

  return (
    <div className='flex gap-1 justify-between px-4 py-6 text-xs tw-'>
      {
        categoryTree && categoryTree.map((category,i) => <SHItem name={category.name} key={category.id}/>)
      }
    </div>
  )
}

export default SubHeader