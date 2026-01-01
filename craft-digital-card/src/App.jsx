import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/shared/Navbar';
import AuthModal from './components/auth/AuthModal';
import UsernameSetup from './components/auth/UsernameSetup';
import LandingPage from './pages/LandingPage';
import PublicCardPage from './pages/PublicCardPage';
import EditorPage from './pages/EditorPage';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, hasUsername, loading, openAuthModal } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Open auth modal and show landing page behind it
    setTimeout(() => openAuthModal(), 100);
    return <LandingPage />;
  }

  if (!hasUsername) {
    // UsernameSetup modal will show automatically
    return <LoadingScreen message="Setting up your profile..." />;
  }

  return children;
}

// Loading screen component
function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(0, 212, 255, 0.2)',
          borderTopColor: '#00d4ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p
        style={{
          marginTop: '20px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
        }}
      >
        {message}
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// 404 page
function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        padding: '20px',
        paddingTop: '80px',
      }}
    >
      <h1 style={{ color: '#fff', fontSize: '72px', marginBottom: '10px' }}>404</h1>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '18px', marginBottom: '30px' }}>
        Page not found
      </p>
      <a
        href="/"
        style={{
          padding: '12px 24px',
          borderRadius: '25px',
          background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
          color: '#000',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        Go Home
      </a>
    </div>
  );
}

// Main app layout
function AppLayout() {
  return (
    <>
      <Navbar />
      <AuthModal />
      <UsernameSetup />
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Editor (protected) */}
        <Route
          path="/edit"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        
        {/* Public card view - must be last as it catches /:username */}
        <Route path="/:username" element={<PublicCardPage />} />
        
        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

// Root App component
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}