import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import AuthLayout from '../components/AuthLayout';

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
      <AuthLayout title="Password Reset" subtitle="Your password has been reset successfully.">
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/login" className="btn btn--primary">Sign In</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password">
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="alert alert--error">{error}</div>}

        <div className="input-field">
          <label className="input-field__label">New Password</label>
          <input className="input-field__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoFocus />
        </div>

        <div className="input-field">
          <label className="input-field__label">Confirm Password</label>
          <input className="input-field__input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
        </div>

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Resetting...' : 'Reset Password'}
        </button>

        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
