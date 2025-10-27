import "./App.css";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home/Home";
import { Provider } from "react-redux";
import store from "./store/store";

const Root = () => {
  return (
    <div className="root" >
      <Header />

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
    ],
  },
]);

function App() {
  return <RouterProvider router={appRouter} />;
}

export default App;
