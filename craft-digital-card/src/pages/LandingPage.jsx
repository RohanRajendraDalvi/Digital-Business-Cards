import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import BusinessCard from '../components/card/BusinessCard';
import { demoCardData } from '../config/demoCard';

export default function LandingPage() {
  const { isAuthenticated, hasUsername, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const handleCreateClick = () => {
    if (isAuthenticated && hasUsername) {
      navigate('/edit');
    } else {
      openAuthModal();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      {/* Hero Section */}
      <div style={{ 
        paddingTop: '60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Hero Text - Above Card */}
        <div style={{
          textAlign: 'center',
          padding: '40px 20px 20px',
          maxWidth: '600px',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: '20px',
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            color: '#00d4ff',
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '16px',
          }}>
            ✨ Free forever • No credit card
          </div>

          {/* Headline */}
          <h1 style={{
            color: '#fff',
            fontSize: 'clamp(28px, 6vw, 52px)',
            fontWeight: '800',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            Your Professional Identity
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              in 3D
            </span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '16px',
            marginBottom: '20px',
          }}>
            Create a stunning interactive business card in minutes
          </p>

          {/* CTA */}
          <button
            onClick={handleCreateClick}
            style={{
              padding: '16px 36px',
              borderRadius: '30px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
              border: 'none',
              color: '#000',
              fontSize: '17px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 10px 40px rgba(0, 212, 255, 0.4)',
            }}
          >
            Create Your Card →
          </button>
        </div>

        {/* Demo Card - Constrained size */}
        <div style={{ 
          width: '100%',
          maxWidth: '800px',
          height: 'clamp(400px, 50vh, 550px)',
          margin: '0 auto',
          padding: '0 20px',
          boxSizing: 'border-box',
        }}>
          <BusinessCard 
            data={demoCardData} 
            showControls={false}  
            showHint={true}
            showTitle={false}
            height="100%"
          />
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px',
      }}>
        {/* Features Grid */}
        <h2 style={{
          color: '#fff',
          fontSize: 'clamp(22px, 4vw, 28px)',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          Why CardCraft?
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '60px',
        }}>
          {[
            { icon: '🎨', title: '14 Stunning Themes', desc: 'Dark and light modes with beautiful color schemes' },
            { icon: '✨', title: 'Fully Interactive', desc: 'Rotate, flip, and zoom your 3D card' },
            { icon: '📱', title: 'Instant Sharing', desc: 'One link works everywhere, no app needed' },
            { icon: '📇', title: 'Add to Contacts', desc: 'One-click vCard download for any viewer' },
          ].map((f) => (
            <div key={f.title} style={{
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Theme Preview */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '700', marginBottom: '16px' }}>
            Choose Your Style
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>
            7 dark themes • 7 light themes • All free
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
            {[
              { name: 'Cyber', colors: ['#00d4ff', '#ffb347'] },
              { name: 'Neon', colors: ['#ff00ff', '#00ffff'] },
              { name: 'Forest', colors: ['#4ade80', '#fbbf24'] },
              { name: 'Ocean', colors: ['#38bdf8', '#2dd4bf'] },
              { name: 'Sunset', colors: ['#f97316', '#facc15'] },
              { name: 'Royal', colors: ['#a855f7', '#fcd34d'] },
              { name: 'Mono', colors: ['#e5e5e5', '#a3a3a3'] },
            ].map((t) => (
              <div key={t.name} style={{
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {t.colors.map((c, i) => (
                    <div key={i} style={{ width: '12px', height: '12px', borderRadius: '4px', background: c }} />
                  ))}
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{
          padding: 'clamp(30px, 5vw, 48px)',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 153, 255, 0.05) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '700', marginBottom: '12px' }}>
            Ready to stand out?
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>
            Create your 3D business card in under 2 minutes
          </p>
          <button onClick={handleCreateClick} style={{
            padding: '14px 32px',
            borderRadius: '25px',
            background: '#fff',
            border: 'none',
            color: '#0a0a0f',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            Get Started Free →
          </button>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: '60px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '13px',
        }}>
          Made with 💙 • Free forever
        </footer>
      </div>
    </div>
  );
}