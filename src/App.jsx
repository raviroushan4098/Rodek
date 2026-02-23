import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CarList from './pages/cars/CarList';
import CarForm from './pages/cars/CarForm';
import CarDetail from './pages/cars/CarDetail';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetail from './pages/customers/CustomerDetail';
import BookingList from './pages/bookings/BookingList';
import BookingForm from './pages/bookings/BookingForm';
import BookingDetail from './pages/bookings/BookingDetail';
import PaymentList from './pages/payments/PaymentList';
import PaymentForm from './pages/payments/PaymentForm';
import OutstandingBalances from './pages/payments/OutstandingBalances';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Locations from './pages/Locations';

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Dashboard />} />
                <Route path="/cars" element={<CarList />} />
                <Route path="/cars/new" element={<CarForm />} />
                <Route path="/cars/:id" element={<CarDetail />} />
                <Route path="/cars/:id/edit" element={<CarForm />} />
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/customers/new" element={<CustomerForm />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/customers/:id/edit" element={<CustomerForm />} />
                <Route path="/bookings" element={<BookingList />} />
                <Route path="/bookings/new" element={<BookingForm />} />
                <Route path="/bookings/:id" element={<BookingDetail />} />
                <Route path="/bookings/:id/edit" element={<BookingForm />} />
                <Route path="/payments" element={<PaymentList />} />
                <Route path="/payments/new" element={<PaymentForm />} />
                <Route path="/payments/outstanding" element={<OutstandingBalances />} />
                <Route
                    path="/locations"
                    element={
                        <ProtectedRoute requiredRole="super_admin">
                            <Locations />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute requiredRole="super_admin">
                            <Settings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute requiredRole="super_admin">
                            <Users />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </Routes>
    );
}
