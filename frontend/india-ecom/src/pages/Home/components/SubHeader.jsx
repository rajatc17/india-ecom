import { useState, useEffect} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategoryTree } from "../../../store/category/categorySlice";

const SubHeader = () => {

  const dispatch = useDispatch();
  const categoryTree = useSelector((state) => state.categories.items)
  const [category, setCategory] = useState(null);
  
  useEffect(()=>{
    dispatch(fetchCategoryTree())
  },[])

  useEffect(()=>{
    //console.log(category)
  },  [category])

  return (
    <div className='relative px-4 py-6 text-xs' onMouseLeave={()=>setCategory(null)}>
      {
        <div className='flex gap-1 justify-between'>
          {
            categoryTree && categoryTree.map((category,i) => 
            <button className='px-2 py-3 font-semibold' key={category.id} onMouseOver={()=>setCategory(category)}> 
              {category.name.toUpperCase()}
            </button>)
          }
        </div>
      }

      <div className={'absolute w-full z-100 bg-white px-6 py-8 flex-col ' + (category ? 'visible' : 'hidden')}>
        {
          category && category.children.map((cat_lvl1 , i)=>
            <ul key={cat_lvl1.id}>
              <li className='text-lg font-semibold'>{cat_lvl1.name}</li>
              <div className='text-sm font-light'>
                {
                  cat_lvl1.children?.map((cat_lvl2 , i)=>
                    
                    <p key={cat_lvl2.id}>{cat_lvl2.name}</p>)
                }
              </div>
            </ul>
          )
        }
      </div>
    </div>
  )
}

export default SubHeader