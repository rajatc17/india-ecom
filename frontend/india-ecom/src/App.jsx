import "./App.css";
import { lazy , Suspense, useEffect, useRef, useState } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router";
import { Provider } from "react-redux";
import store from "./store/store";
import Loader from "./components/common/Loader";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader";
import Footer from "./components/Footer";
import Home from "./pages/Home/Home";
import { useDispatch, useSelector } from "react-redux";
import { API_ACTIVITY_EVENT, BACKEND_WARMUP_EVENT, setToken, warmupBackend } from "./api/client";
import { fetchCurrentUser, setAuthInitialized } from "./store/auth/authSlice";
import { clearDeletedItemMessage, fetchCart, syncCart } from "./store/cart/cartSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import Category from "./pages/Category/Category";
import ProductDetailShimmer from "./pages/ProductDetail/ProductDetailShimmer";
import AccountShimmer from "./pages/Account/AccountShimmer";

//const Login = lazy(()=>import('./pages/Login/Login'))
//const Category = lazy(()=>import('./pages/Category/Category'))
const Account = lazy(()=>import('./pages/Account/Account'))
const ProductDetail = lazy(()=>import('./pages/ProductDetail/ProductDetail'))
const Cart = lazy(()=>import('./pages/Cart/Cart'))
const Wishlist = lazy(()=>import('./pages/Wishlist/Wishlist'))
const Search = lazy(()=>import('./pages/Search/Search'))
const Checkout = lazy(()=>import('./pages/Checkout/Checkout'))
const Orders = lazy(()=>import('./pages/Orders/Orders'))
const OrderDetails = lazy(()=>import('./pages/Orders/OrderDetails'))

const RouteFallback = ({ message = "Loading page..." }) => (
  <Loader fullScreen message={message} />
);

const Root = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [bootstrapComplete, setBootstrapComplete] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState("Preparing your storefront...");
  const [showWarmupBanner, setShowWarmupBanner] = useState(false);
  const [isPageDataReady, setIsPageDataReady] = useState(true);
  const previousAuthStateRef = useRef(null);
  const warmupBannerTimeoutRef = useRef(null);
  const pageReadyTimerRef = useRef(null);
  const pendingApiCountRef = useRef(0);
  const { isAuthenticated, initialized } = useSelector((state) => state.auth);
  const isCheckoutRoute = location.pathname.startsWith('/checkout');

  const hasGuestCartItems = () => {
    try {
      const parsedGuestCart = JSON.parse(localStorage.getItem('guest_cart') || '{"items":[]}');
      return Array.isArray(parsedGuestCart?.items) && parsedGuestCart.items.length > 0;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapApp = async () => {
      const storedToken = localStorage.getItem('token');

      setBootstrapMessage("Waking up server, this can take a few seconds...");
      await warmupBackend();
      setBootstrapMessage("Preparing your storefront...");

      if (storedToken) {
        setToken(storedToken);
        await dispatch(fetchCurrentUser());
      } else {
        dispatch(setAuthInitialized());
      }

      const authStateAfterBootstrap = store.getState().auth?.isAuthenticated;
      if (authStateAfterBootstrap && hasGuestCartItems()) {
        await dispatch(syncCart());
      } else {
        await dispatch(fetchCart());
      }

      if (isMounted) {
        setBootstrapComplete(true);
      }
    };

    bootstrapApp();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!bootstrapComplete) {
      return;
    }

    const previousAuthState = previousAuthStateRef.current;
    if (previousAuthState === null) {
      previousAuthStateRef.current = isAuthenticated;
      return;
    }

    if (!previousAuthState && isAuthenticated) {
      if (hasGuestCartItems()) {
        dispatch(syncCart());
      } else {
        dispatch(fetchCart());
      }
    }

    if (previousAuthState && !isAuthenticated) {
      dispatch(fetchCart());
    }

    previousAuthStateRef.current = isAuthenticated;
  }, [bootstrapComplete, dispatch, isAuthenticated]);

  useEffect(() => {
    const handleWarmupStatus = (event) => {
      const status = event?.detail?.status;

      if (status === 'started') {
        if (warmupBannerTimeoutRef.current) {
          clearTimeout(warmupBannerTimeoutRef.current);
        }
        setShowWarmupBanner(true);
      }

      if (status === 'completed') {
        if (warmupBannerTimeoutRef.current) {
          clearTimeout(warmupBannerTimeoutRef.current);
        }

        warmupBannerTimeoutRef.current = setTimeout(() => {
          setShowWarmupBanner(false);
        }, 1200);
      }
    };

    window.addEventListener(BACKEND_WARMUP_EVENT, handleWarmupStatus);

    return () => {
      window.removeEventListener(BACKEND_WARMUP_EVENT, handleWarmupStatus);
      if (warmupBannerTimeoutRef.current) {
        clearTimeout(warmupBannerTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleApiActivity = (event) => {
      const pendingCount = Number(event?.detail?.inFlightRequests || 0);
      pendingApiCountRef.current = pendingCount;

      if (pendingCount > 0) {
        setIsPageDataReady(false);
        return;
      }

      if (pageReadyTimerRef.current) {
        clearTimeout(pageReadyTimerRef.current);
      }

      pageReadyTimerRef.current = setTimeout(() => {
        setIsPageDataReady(true);
      }, 80);
    };

    window.addEventListener(API_ACTIVITY_EVENT, handleApiActivity);

    return () => {
      window.removeEventListener(API_ACTIVITY_EVENT, handleApiActivity);
      if (pageReadyTimerRef.current) {
        clearTimeout(pageReadyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!initialized || !bootstrapComplete) {
      return;
    }

    setIsPageDataReady(false);

    if (pageReadyTimerRef.current) {
      clearTimeout(pageReadyTimerRef.current);
    }

    if (pendingApiCountRef.current === 0) {
      pageReadyTimerRef.current = setTimeout(() => {
        setIsPageDataReady(true);
      }, 80);
    }
  }, [location.pathname, location.search, initialized, bootstrapComplete]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  useEffect(() => {
    dispatch(clearDeletedItemMessage());
  }, [dispatch, location.pathname, location.search]);

  if (!initialized || !bootstrapComplete) {
    return <RouteFallback message={bootstrapMessage} />;
  }

  return (
    <div className="root" >
      {showWarmupBanner && (
        <div className="warmup-banner" role="status" aria-live="polite">
          Server is waking up, requests may take a few seconds.
        </div>
      )}

      <Header
        isCategoryMenuOpen={isCategoryMenuOpen}
        onToggleCategoryMenu={() => setIsCategoryMenuOpen((open) => !open)}
      />
      
      {!isCheckoutRoute && (
        <SubHeader
          isCategoryMenuOpen={isCategoryMenuOpen}
          onCloseCategoryMenu={() => setIsCategoryMenuOpen(false)}
        />
      )}

      <div className={`main-content ${location.pathname === "/" ? "home-page-fade" : ""} ${isPageDataReady ? "page-data-ready" : "page-data-pending"}`}>
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
        <Suspense fallback={<AccountShimmer />}>
          <ProtectedRoute requireAuth={true} >
            <Account />
          </ProtectedRoute>
        </Suspense>
      },
      {
        path: '/my-orders',
        element: (
          <Suspense fallback={<RouteFallback message="Loading orders..." />}>
            <ProtectedRoute requireAuth={true}>
              <Orders />
            </ProtectedRoute>
          </Suspense>
        )
      },
      {
        path: '/my-orders/:orderId',
        element: (
          <Suspense fallback={<RouteFallback message="Loading order details..." />}>
            <ProtectedRoute requireAuth={true}>
              <OrderDetails />
            </ProtectedRoute>
          </Suspense>
        )
      },
      {
        path : '/product/:slug',
        element : 
        <Suspense fallback={<ProductDetailShimmer />}>
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
      {        path: '/wishlist',
        element: (
          <Suspense fallback={<RouteFallback message="Loading wishlist..." />}> 
            <ProtectedRoute requireAuth={true}>
              <Wishlist />
            </ProtectedRoute>
          </Suspense>
        )
      },
      {        path: '/search',
        element: (
          <Suspense fallback={<RouteFallback message="Loading search..." />}>
            <Search />
          </Suspense>
        )
      },
      {
        path: '/checkout',
        element: (
          <Suspense fallback={<RouteFallback message="Loading checkout..." />}>
            <Checkout />
          </Suspense>
        )
      },
      {
        path: '/checkout/payment',
        element: (
          <Suspense fallback={<RouteFallback message="Loading checkout..." />}>
            <Checkout />
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
