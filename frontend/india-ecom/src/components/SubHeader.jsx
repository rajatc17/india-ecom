import { useState, useEffect, useRef} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategoryTree } from "../store/category/categorySlice";

const SubHeader = () => {

  const dispatch = useDispatch();
  const categoryTree = useSelector((state) => state.categories.items)
  const [category, setCategory] = useState(null);
  const [isHovered , setIsHovered] = useState(false);
  const catRef = useRef(null);
  const timerRef = useRef(null)
  
  useEffect(()=>{
    dispatch(fetchCategoryTree())
  },[])

  useEffect(()=>{
   clearTimeout(timerRef.current)
  },[category])
 
  const handleSHMouseLeave = ()=>{
    setIsHovered(false);
    //setCategory(null);
  }

  const handleCategoryHover = (category)=>{
    setIsHovered(false);
    timerRef.current = setTimeout(()=> {
      setCategory(category) 
      setIsHovered(true)
    }, 200);
  }

  return (
    <div className='sticky px-4 py-2 text-xs z-100' onMouseLeave={()=>handleSHMouseLeave()}>
      {
        <div className='flex gap-1 justify-between'>
          {
            categoryTree && categoryTree.map((category,i) => 
            <button className='px-2 py-3 font-semibold' key={category.id} onMouseOver={()=> handleCategoryHover(category)}> 
              {category.name.toUpperCase()}
            </button>)
          }
        </div>
      }

      <div className={'absolute w-full bg-white px-6 py-8 flex-col transition-all delay-0 duration-150 ease-in-out ' + (isHovered ? 'visible opacity-100' : 'invisible opacity-0')} 
      ref={catRef}>
        {
          category && category.children.map((cat_lvl1 , i)=>
            <ul key={cat_lvl1.id}>
              <li className='text-lg font-semibold '>{cat_lvl1.name}</li>
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