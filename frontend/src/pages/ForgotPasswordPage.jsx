import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="page-center">
        <div className="login-card">
          <div className="login-card__header">
            <span className="login-card__icon">{'\u2709'}</span>
            <h1>Check Your Email</h1>
            <p>If an account with that email exists, we've sent a password reset link.</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/login" className="btn btn--primary">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="login-card">
        <div className="login-card__header">
          <span className="login-card__icon">{'\u25C8'}</span>
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="login-card__form">
          {error && <div className="alert alert--error">{error}</div>}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <Link to="/login" style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
