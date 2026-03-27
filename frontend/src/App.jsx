import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { FullPageSpinner } from './components/Spinner';
import Navbar from './Components/layout/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './Pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import AdminPanel from './pages/AdminPanel';

const App = () => {
  const { loading } = useAuth();
  const { dark } = useTheme();
  if (loading) return <FullPageSpinner />;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-body)' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: dark ? '#1e293b' : '#ffffff',
            color: dark ? '#f1f5f9' : '#1e293b',
            border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
            fontSize: '14px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          },
          success: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute requireProfile><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <h1 className="text-7xl font-black text-gradient">404</h1>
                <p className="mt-3 text-lg" style={{ color: 'var(--text-secondary)' }}>Page not found</p>
              </div>
    
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default App;
