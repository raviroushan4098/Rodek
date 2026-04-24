import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from './PageLoader';

export default function ProtectedRoute({ children, requiredRole }) {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return <PageLoader source="ProtectedRoute" />;
    }

    if (!user) return <Navigate to="/login" replace />;

    if (requiredRole === 'super_admin' && userProfile?.role !== 'super_admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
