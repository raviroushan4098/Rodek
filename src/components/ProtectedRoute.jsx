import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (requiredRole === 'super_admin' && userProfile?.role !== 'super_admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
