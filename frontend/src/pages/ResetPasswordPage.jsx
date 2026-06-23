import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="page-center">
        <div className="login-card">
          <div className="login-card__header">
            <span className="login-card__icon">{'\u2713'}</span>
            <h1>Password Reset</h1>
            <p>Your password has been reset successfully.</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/login" className="btn btn--primary">Sign In</Link>
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
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>
        <form onSubmit={handleSubmit} className="login-card__form">
          {error && <div className="alert alert--error">{error}</div>}
          <label>
            New Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Resetting...' : 'Reset Password'}
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
