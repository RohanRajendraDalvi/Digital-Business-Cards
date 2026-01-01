import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, hasUsername, username, openAuthModal, signOut, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isEditorPage = location.pathname === '/edit';

  const handleCreateClick = () => {
    if (isAuthenticated && hasUsername) {
      navigate('/edit');
    } else {
      openAuthModal();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          💳
        </div>
        <span
          style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '-0.5px',
          }}
        >
          CardCraft
        </span>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {loading ? (
          // Loading state
          <div
            style={{
              width: '100px',
              height: '36px',
              borderRadius: '18px',
              background: 'rgba(255, 255, 255, 0.1)',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ) : isAuthenticated && hasUsername ? (
          // Authenticated user
          <>
            {/* View my card button (when not on editor) */}
            {!isEditorPage && (
              <Link
                to={`/${username}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
              >
                My Card
              </Link>
            )}
            
            {/* Edit button (when not on editor) */}
            {!isEditorPage && (
              <Link
                to="/edit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
                  color: '#000',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
              >
                Edit Card
              </Link>
            )}

            {/* View live button (when on editor) */}
            {isEditorPage && (
              <Link
                to={`/${username}`}
                target="_blank"
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                View Live
                <span style={{ fontSize: '12px' }}>↗</span>
              </Link>
            )}

            {/* User menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Sign Out
              </button>
            </div>
          </>
        ) : (
          // Not authenticated
          <>
            <button
              onClick={openAuthModal}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              onClick={handleCreateClick}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
                border: 'none',
                color: '#000',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Create Yours
            </button>
          </>
        )}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </nav>
  );
}