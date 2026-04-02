import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/MAuthContext';
import { FullPageSpinner } from './MSpinner';

const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  return children;
};

export default AdminRoute;