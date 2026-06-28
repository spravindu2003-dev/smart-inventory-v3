import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/auth';
import AuthLayout from '../components/AuthLayout';

export default function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
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
      const res = await registerUser(name, email, password);
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
    <AuthLayout title="Create your account" subtitle="Register as an owner to get started">
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="alert alert--error">{error}</div>}

        <div className="input-field">
          <label className="input-field__label">Full Name</label>
          <input className="input-field__input" type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoFocus placeholder="John Doe" />
        </div>

        <div className="input-field">
          <label className="input-field__label">Email</label>
          <input className="input-field__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>

        <div className="input-field">
          <label className="input-field__label">Password</label>
          <input className="input-field__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
        </div>

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="auth-signup">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
