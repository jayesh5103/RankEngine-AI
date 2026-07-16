import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a group of routes that require authentication.
 * Redirects to /login when no JWT token is present.
 * Use as: <Route element={<ProtectedRoute />}> ... </Route>
 */
export default function ProtectedRoute() {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
