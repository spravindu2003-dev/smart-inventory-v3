import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="split-layout">
      {/* Left Panel — Branding */}
      <div className="split-panel split-panel--brand">
        <div className="split-bg">
          <div className="split-bg__blob split-bg__blob--1" />
          <div className="split-bg__blob split-bg__blob--2" />
          <div className="split-bg__blob split-bg__blob--3" />
        </div>
        <div className="split-brand">
          <Link to="/" className="split-brand__link">
            <span className="split-brand__icon">{'\u25C8'}</span>
            <span className="split-brand__title">Smart Inventory</span>
          </Link>
        </div>
        <div className="split-hero">
          <h1 className="split-hero__title">Smart Inventory System</h1>
          <p className="split-hero__subtitle">
            Manage stock, sales and insights in real time
          </p>
          <ul className="split-features">
            <li className="split-features__item">
              <svg className="split-features__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Real-time inventory tracking
            </li>
            <li className="split-features__item">
              <svg className="split-features__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Smart analytics &amp; reports
            </li>
            <li className="split-features__item">
              <svg className="split-features__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Role-based access control
            </li>
          </ul>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="split-panel split-panel--form">
        <div className="split-form-card">
          <div className="split-form-header">
            <h2 className="split-form-header__title">Welcome back</h2>
            <p className="split-form-header__subtitle">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="split-form">
            {error && <div className="alert alert--error">{error}</div>}

            <div className="input-field">
              <label className="input-field__label">Email</label>
              <input
                className="input-field__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
              />
            </div>

            <div className="input-field">
              <label className="input-field__label">Password</label>
              <input
                className="input-field__input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <div className="split-form-options">
              <Link to="/forgot-password" className="split-form-options__link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn--primary btn--lg split-form__btn" disabled={submitting}>
              {submitting ? (
                <span className="btn__spinner" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="split-form-footer">
            Don&rsquo;t have an account?{' '}
            <Link to="/signup">Register as Owner</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
