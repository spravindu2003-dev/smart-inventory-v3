import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthShield() {
  return (
    <div className="auth-shield">
      <div className="auth-shield__card">
        <div className="auth-shield__spinner" />
        <div className="auth-shield__lines">
          <div className="auth-shield__line auth-shield__line--short" />
          <div className="auth-shield__line auth-shield__line--long" />
          <div className="auth-shield__line auth-shield__line--short" />
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const [shield, setShield] = useState(true);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    if (!loading) {
      const elapsed = Date.now() - mountTime.current;
      const remaining = Math.max(0, 300 - elapsed);
      const timer = setTimeout(() => setShield(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || shield) {
    return <AuthShield />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
