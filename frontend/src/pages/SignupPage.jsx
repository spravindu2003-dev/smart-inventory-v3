import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/auth';

export default function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
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
      const res = await registerUser(username, email, password);
      toast.success(res.data.message || 'Account created successfully');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-center">
      <div className="login-card">
        <div className="login-card__header">
          <span className="login-card__icon">{'\u25C8'}</span>
          <h1>Owner Onboarding</h1>
          <p>Create your business account to get started</p>
        </div>
        <form onSubmit={handleSubmit} className="login-card__form">
          {error && <div className="alert alert--error">{error}</div>}
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              autoFocus
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Already have an account?{' '}
            </span>
            <Link to="/login" style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
