import {useEffect} from 'react'

const LandingPage = () => {
  useEffect(() => {

    const fetchProducts = async () => {
        const data = await fetch('http://localhost:5000/api/products/featured');
        const json = await data.json();
        console.log(json);
    }

    fetchProducts();
  }, []);

  return (
    <div>
        
    </div>
  )
}

export default LandingPage