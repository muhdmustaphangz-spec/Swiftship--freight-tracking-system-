import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Shell from './components/Shell';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TrackPublic from './pages/TrackPublic';

import CustomerBook from './pages/CustomerBook';
import CustomerShipments from './pages/CustomerShipments';
import ShipmentDetail from './pages/ShipmentDetail';

import AdminDashboard from './pages/AdminDashboard';
import AdminShipments from './pages/AdminShipments';

import DriverPortal from './pages/DriverPortal';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/track" element={<TrackPublic />} />
            <Route path="/track/:trackingId" element={<TrackPublic />} />

            <Route path="/customer" element={
              <ProtectedRoute roles={['customer']}><CustomerBook /></ProtectedRoute>
            } />
            <Route path="/customer/shipments" element={
              <ProtectedRoute roles={['customer']}><CustomerShipments /></ProtectedRoute>
            } />
            <Route path="/customer/shipments/:id" element={
              <ProtectedRoute roles={['customer']}><ShipmentDetail /></ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/shipments" element={
              <ProtectedRoute roles={['admin']}><AdminShipments /></ProtectedRoute>
            } />
            <Route path="/admin/shipments/:id" element={
              <ProtectedRoute roles={['admin']}><ShipmentDetail /></ProtectedRoute>
            } />

            <Route path="/driver" element={
              <ProtectedRoute roles={['driver']}><DriverPortal /></ProtectedRoute>
            } />
            <Route path="/driver/shipments/:id" element={
              <ProtectedRoute roles={['driver']}><ShipmentDetail /></ProtectedRoute>
            } />

            <Route path="*" element={<Landing />} />
          </Routes>
        </Shell>
      </AuthProvider>
    </BrowserRouter>
  );
}
