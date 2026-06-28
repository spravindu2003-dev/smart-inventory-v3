import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign in to your account" subtitle="Enter your credentials to access the dashboard">
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="alert alert--error">{error}</div>}

        <div className="input-field">
          <label className="input-field__label">Email</label>
          <input className="input-field__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>

        <div className="input-field">
          <label className="input-field__label">Password</label>
          <input className="input-field__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <p className="auth-signup">
          Don&rsquo;t have an account? <Link to="/signup">Join as Owner</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
