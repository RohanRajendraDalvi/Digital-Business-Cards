import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/shared/Navbar';
import AuthModal from './components/auth/AuthModal';
import UsernameSetup from './components/auth/UsernameSetup';
import LandingPage from './pages/LandingPage';
import PublicCardPage from './pages/PublicCardPage';
import EditorPage from './pages/EditorPage';

function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0, 212, 255, 0.2)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '20px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)', padding: '20px', paddingTop: '80px' }}>
      <h1 style={{ color: '#fff', fontSize: '72px', marginBottom: '10px' }}>404</h1>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '18px', marginBottom: '30px' }}>Page not found</p>
      <a href="/" style={{ padding: '12px 24px', borderRadius: '25px', background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)', color: '#000', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Go Home</a>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const { loading } = useAuth();
  
  // Check if current route is a public card page (/:username pattern)
  // Exclude known routes like /edit, /
  const isPublicCardPage = location.pathname !== '/' && 
                           location.pathname !== '/edit' && 
                           !location.pathname.startsWith('/edit/') &&
                           location.pathname.match(/^\/[^/]+$/);

  // Show loading screen while auth state is being determined
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Hide navbar on public card pages */}
      {!isPublicCardPage && <Navbar />}
      <AuthModal />
      <UsernameSetup />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Editor is now accessible without auth - guest mode supported */}
        <Route path="/edit" element={<EditorPage />} />
        <Route path="/:username" element={<PublicCardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}