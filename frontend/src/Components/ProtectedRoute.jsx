import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from './Spinner';

const ProtectedRoute = ({ children, requireProfile = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (
    requireProfile &&
    user.role === 'Student' &&
    !user.isProfileComplete &&
    location.pathname !== '/profile-setup'
  ) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

export default ProtectedRoute;