import "./App.css";
import { lazy , Suspense, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { Provider } from "react-redux";
import store from "./store/store";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader";
import Footer from "./components/Footer";
import Home from "./pages/Home/Home";
import { useDispatch, useSelector } from "react-redux";
import { setToken } from "./api/client";
import { fetchCurrentUser } from "./store/auth/authSlice";
import { fetchCart, syncCart } from "./store/cart/cartSlice";
import ProtectedRoute from "./components/ProtectedRoute";
//import Category from "./pages/Category/Category";

//const Login = lazy(()=>import('./pages/Login/Login'))
const Category = lazy(()=>import('./pages/Category/Category'))
const Account = lazy(()=>import('./pages/Account/Account'))
const ProductDetail = lazy(()=>import('./pages/ProductDetail/ProductDetail'))
const Cart = lazy(()=>import('./pages/Cart/Cart'))

const Root = () => {
  const dispatch = useDispatch();
  const { token , isAuthenticated, loading, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken && !isAuthenticated) {
      setToken(storedToken);
      dispatch(fetchCurrentUser());
    }
    
  
    dispatch(fetchCart());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(syncCart());
    }
  }, [isAuthenticated, dispatch]);

  if(!initialized && token){
    return <div>Loading...</div>
  }
  return (
    <div className="root" >
      <Header />
      
      <SubHeader />

      <div className="main-content">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
};

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Provider store={store} > <Root /> </Provider>,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path : '/category/:slug',        
        element : 
        <Suspense fallback={()=><div>Loading...</div>}>
          <Category />
        </Suspense>
      },
      {
        path : '/account',
        element : 
        <Suspense fallback={()=><div>Loading...</div>}>
          <ProtectedRoute requireAuth={true} >
            <Account />
          </ProtectedRoute>
        </Suspense>
      },
      {
        path : '/product/:slug',
        element : 
        <Suspense fallback={()=><div>Loading...</div>}>
          <ProtectedRoute requireAuth={false} >
            <ProductDetail />
          </ProtectedRoute>
        </Suspense>
      },
      {
        path: '/cart',
        element: (
          <Suspense fallback={() => <div>Loading...</div>}>
            <Cart />
          </Suspense>
        )
      }
    ],
  },
]);

function App() {

  return <RouterProvider router={appRouter} />;
}

export default App;
