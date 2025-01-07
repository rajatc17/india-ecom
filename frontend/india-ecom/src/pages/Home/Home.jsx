import { useEffect } from "react";
import Hero from "./components/Hero";

const Home = () => {
  useEffect(() => {
    const fetchProducts = async () => {
      const data = await fetch("http://localhost:5000/api/categories?level=0");
      const json = await data.json();
      const cats = json.map(element => {
        return element.name
      });
      //console.log(cats)
    };

    fetchProducts();
  }, []);

  return (
    <div className="bg-amber-100">
      <Hero />
    </div>
  );
};

export default Home;
