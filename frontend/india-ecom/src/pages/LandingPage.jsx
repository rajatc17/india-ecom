import { useEffect } from "react";

const LandingPage = () => {
  useEffect(() => {
    const fetchProducts = async () => {
      const data = await fetch("http://localhost:5000/api/categories?level=0");
      const json = await data.json();
      console.log(json);
    };

    fetchProducts();
  }, []);

  return (
    <div className="bg-amber-400">
    </div>
  );
};

export default LandingPage;
