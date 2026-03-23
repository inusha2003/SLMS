import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#251F39',
            color: '#e2e8f0',
            border: '1px solid rgba(57, 55, 119, 0.4)',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#4ade80', secondary: '#251F39' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#251F39' },
          },
        }}
      />
      <AppRouter />
    </AuthProvider>
  );
}

export default App;