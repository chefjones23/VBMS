import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import NewBooking from './pages/NewBooking';
import HodDashboard from './pages/HodDashboard';
import TransporterDashboard from './pages/TransporterDashboard';
import FleetPage from './pages/FleetPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffPage from './pages/StaffPage';
import ChangePassword from './pages/ChangePassword';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function HomeDashboard() {
  const { user } = useAuth();
  if (user.role === 'user') return <UserDashboard />;
  if (user.role === 'hod') return <HodDashboard />;
  if (user.role === 'transporter') return <TransporterDashboard />;
  return <AdminDashboard />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/" element={<RequireAuth><HomeDashboard /></RequireAuth>} />

      <Route path="/new" element={
        <RequireAuth>{user?.role === 'user' ? <NewBooking /> : <Navigate to="/" replace />}</RequireAuth>
      } />

      <Route path="/fleet" element={
        <RequireAuth>
          {['transporter', 'admin'].includes(user?.role) ? <FleetPage /> : <Navigate to="/" replace />}
        </RequireAuth>
      } />

      <Route path="/staff" element={
        <RequireAuth>{user?.role === 'admin' ? <StaffPage /> : <Navigate to="/" replace />}</RequireAuth>
      } />

      <Route path="/change-password" element={<RequireAuth><ChangePassword /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
