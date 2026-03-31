import "./App.css";
import { lazy , Suspense, useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router";
import { Provider } from "react-redux";
import store from "./store/store";
import Loader from "./components/common/Loader";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader";
import Footer from "./components/Footer";
import Home from "./pages/Home/Home";
import { useDispatch, useSelector } from "react-redux";
import { setToken } from "./api/client";
import { fetchCurrentUser, setAuthInitialized } from "./store/auth/authSlice";
import { fetchCart, syncCart } from "./store/cart/cartSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import Category from "./pages/Category/Category";

//const Login = lazy(()=>import('./pages/Login/Login'))
//const Category = lazy(()=>import('./pages/Category/Category'))
const Account = lazy(()=>import('./pages/Account/Account'))
const ProductDetail = lazy(()=>import('./pages/ProductDetail/ProductDetail'))
const Cart = lazy(()=>import('./pages/Cart/Cart'))
const Search = lazy(()=>import('./pages/Search/Search'))

const RouteFallback = ({ message = "Loading page..." }) => (
  <Loader fullScreen message={message} />
);

const Root = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const { isAuthenticated, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken && !isAuthenticated) {
      setToken(storedToken);
      dispatch(fetchCurrentUser());
    } else if (!storedToken) {
      dispatch(setAuthInitialized());
    }
    
  
    dispatch(fetchCart());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(syncCart());
    }
  }, [isAuthenticated, dispatch]);

  if (!initialized) {
    return <RouteFallback message="Preparing your storefront..." />;
  }

  return (
    <div className="root" >
      <Header
        isCategoryMenuOpen={isCategoryMenuOpen}
        onToggleCategoryMenu={() => setIsCategoryMenuOpen((open) => !open)}
      />
      
      <SubHeader
        isCategoryMenuOpen={isCategoryMenuOpen}
        onCloseCategoryMenu={() => setIsCategoryMenuOpen(false)}
      />

      <div className={`main-content ${location.pathname === "/" ? "home-page-fade" : ""}`}>
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
        <Suspense fallback={<RouteFallback message="Loading category..." />}>
          <Category />
        </Suspense>
      },
      {
        path : '/account',
        element : 
        <Suspense fallback={<RouteFallback message="Loading account..." />}>
          <ProtectedRoute requireAuth={true} >
            <Account />
          </ProtectedRoute>
        </Suspense>
      },
      {
        path : '/product/:slug',
        element : 
        <Suspense fallback={<RouteFallback message="Loading product..." />}>
          <ProtectedRoute requireAuth={false} >
            <ProductDetail />
          </ProtectedRoute>
        </Suspense>
      },
      {
        path: '/cart',
        element: (
          <Suspense fallback={<RouteFallback message="Loading cart..." />}>
            <Cart />
          </Suspense>
        )
      },
      {
        path: '/search',
        element: (
          <Suspense fallback={<RouteFallback message="Loading search..." />}>
            <Search />
          </Suspense>
        )
      }
    ],
  },
]);

function App() {

  return (
    <RouterProvider
      router={appRouter}
      fallbackElement={<RouteFallback message="Starting app..." />}
    />
  );
}

export default App;
