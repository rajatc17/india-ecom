import "./App.css";
import { lazy , Suspense } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { Provider } from "react-redux";
import store from "./store/store";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader";
import Footer from "./components/Footer";
import Home from "./pages/Home/Home";
//import Category from "./pages/Category/Category";

const Login = lazy(()=>import('./pages/Login/Login'))
const Category = lazy(()=>import('./pages/Category/Category'))

const Root = () => {
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
        element : <Category />
      },
      // {
      //   path : '/login',
      //   element : 
      //   <Suspense fallback={()=><div>Loading...</div>}>
      //     <Login />
      //   </Suspense>  
      // }
    ],
  },
]);

function App() {
  return <RouterProvider router={appRouter} />;
}

export default App;
