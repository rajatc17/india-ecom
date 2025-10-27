import { useEffect } from "react";
import Hero from "./components/Hero";
import SubHeader from "./components/SubHeader";
import { useSelector , useDispatch } from "react-redux";
import { fetchProducts } from "../../store/product/productSlice";

const Home = () => {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.items);
  
  useEffect(()=>{
    dispatch(fetchProducts({page: 1, limit : 100}));
  }, [])

  return (
    <div className="">
      <SubHeader />
      <Hero />
    </div>
  );
};

export default Home;
