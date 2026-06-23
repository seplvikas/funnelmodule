import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import { SEPLFunnelApp } from './components/sepl/SEPLFunnelApp';

function LoginPrompt() {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f7f9fc' 
    }}>
      <div style={{ 
        width: 500, 
        maxWidth: '92vw', 
        background: '#fff', 
        border: '1px solid #dbe3ef', 
        borderRadius: 12, 
        padding: 24 
      }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>🔐 Login Required</h2>
        <p style={{ marginTop: 10, color: '#475569', lineHeight: '1.6' }}>
          You need to login to the main portal first to access the Funnel.
        </p>
        <ol style={{ marginTop: 16, color: '#475569', lineHeight: '1.8', paddingLeft: 20 }}>
          <li>Click "Go to Main Portal" below</li>
          <li>Login with your Azure AD credentials</li>
          <li>After login, return to this page</li>
        </ol>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.location.href = 'https://demo.surbhi.net'}
            style={{
              background: '#0f4aa1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Go to Main Portal
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#e5e7eb',
              color: '#1f2937',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Refresh Page
          </button>
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>
          Main Portal: <a href="https://demo.surbhi.net" target="_blank" style={{ color: '#0f4aa1' }}>demo.surbhi.net</a>
        </p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  // Debug: Log user object to console
  useEffect(() => {
    if (user) {
      console.log('🔍 User object:', user);
      console.log('📧 User email:', user.email);
      console.log('🔐 User permissions:', user.permissions);
      console.log('⚙️ Top-level can_view_sepl:', (user as any).can_view_sepl);
      console.log('⚙️ Top-level is_admin:', (user as any).is_admin);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPrompt />;
  }

  // Check if user has SEPL permissions (handle both nested and top-level permissions)
  const canViewSepl = 
    user.permissions?.can_view_sepl || 
    user.permissions?.is_admin ||
    (user as any).can_view_sepl ||
    (user as any).is_admin ||
    user.email?.toLowerCase() === 'vikas@surbhi.net'; // Always allow vikas
  
  if (!canViewSepl) {
    return (
      <div style={{ 
        fontFamily: 'Arial, sans-serif', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f7f9fc' 
      }}>
        <div style={{ 
          width: 520, 
          maxWidth: '92vw', 
          background: '#fff', 
          border: '1px solid #dbe3ef', 
          borderRadius: 12, 
          padding: 24 
        }}>
          <h2 style={{ margin: 0, color: '#991b1b' }}>Access Denied</h2>
          <p style={{ marginTop: 10, color: '#475569' }}>
            You do not have permission to access the Funnel. Please contact your administrator to request <code>can_view_sepl</code> permission.
          </p>
          <details style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Debug Info (for troubleshooting)</summary>
            <pre style={{ marginTop: 8, padding: 12, background: '#f1f5f9', borderRadius: 6, overflow: 'auto' }}>
              {JSON.stringify({ 
                email: user?.email,
                permissions: user?.permissions,
                topLevelAdmin: (user as any)?.is_admin,
                topLevelSepl: (user as any)?.can_view_sepl
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return <SEPLFunnelApp />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NavigationProvider>
          <Routes>
            <Route path="/" element={<AuthenticatedApp />} />
            <Route path="/*" element={<Navigate to="/" replace />} />
          </Routes>
        </NavigationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
