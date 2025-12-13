import { Navigate, useLocation } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { openLoginModal } from '../store/modal/modalSlice';

const ProtectedRoute = ({ children, requireAuth = true, requireAdmin = false }) => {
  const { isAuthenticated, currentUser, initialized, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {

    if (requireAuth && initialized && !isAuthenticated && !loading) {
      dispatch(openLoginModal());
    }
  }, [requireAuth, isAuthenticated, initialized, loading, dispatch]);

  if (!initialized || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireAdmin && (!currentUser || currentUser.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;