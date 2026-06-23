import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { getMyProfile, updateMyProfile } from '../api/users';
import { changePassword } from '../api/auth';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { loading, run } = useFetch();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    run(async (signal) => {
      const res = await getMyProfile(signal);
      setProfile(res.data);
      setForm({
        firstName: res.data?.firstName || '',
        lastName: res.data?.lastName || '',
        email: res.data?.email || '',
      });
    });
  }, [run]);

  async function handleProfileSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await updateMyProfile({
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        email: form.email,
      });
      setProfile(res.data);
      setSaveMsg('Profile updated successfully');
    } catch (err) {
      setSaveMsg(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg('Passwords do not match');
      return;
    }
    setPwSaving(true);
    setPwMsg('');
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwMsg('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwSaving(false);
    }
  }

  function setField(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  if (loading && !profile) {
    return <div className="page-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <h2 className="page-title">Settings</h2>

      <div className="rpt-grid" style={{ maxWidth: 720 }}>
        {/* Profile Information */}
        <div className="rpt-card rpt-card--wide">
          <h3 className="rpt-card__title">Profile Information</h3>
          {saveMsg && (
            <div
              className={`alert ${saveMsg === 'Profile updated successfully' ? 'alert--success' : 'alert--error'}`}
              style={{ marginBottom: '0.75rem' }}
            >
              {saveMsg}
            </div>
          )}
          <form onSubmit={handleProfileSave}>
            <div className="form-row">
              <label>
                First Name
                <input value={form.firstName} onChange={setField('firstName')} />
              </label>
              <label>
                Last Name
                <input value={form.lastName} onChange={setField('lastName')} />
              </label>
            </div>
            <label>
              Email
              <input type="email" value={form.email} onChange={setField('email')} required />
            </label>
            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="rpt-card rpt-card--wide">
          <h3 className="rpt-card__title">Change Password</h3>
          {pwMsg && (
            <div
              className={`alert ${pwMsg === 'Password changed successfully' ? 'alert--success' : 'alert--error'}`}
              style={{ marginBottom: '0.75rem' }}
            >
              {pwMsg}
            </div>
          )}
          <form onSubmit={handlePasswordChange}>
            <label>
              Current Password
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </label>
            <div className="form-row">
              <label>
                New Password
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </label>
              <label>
                Confirm Password
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </label>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn--primary" disabled={pwSaving}>
                {pwSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Details */}
        <div className="rpt-card rpt-card--wide">
          <h3 className="rpt-card__title">Account Details</h3>
          <div className="rpt-insights">
            <div className="rpt-insight">
              <span className="rpt-insight__label">Username</span>
              <span className="rpt-insight__value">{user?.username}</span>
            </div>
            <div className="rpt-insight">
              <span className="rpt-insight__label">Role</span>
              <span className="rpt-insight__value">
                <span className="badge badge--role">{user?.role}</span>
              </span>
            </div>
            <div className="rpt-insight">
              <span className="rpt-insight__label">Status</span>
              <span className="rpt-insight__value">
                <span className={`badge badge--${profile?.isActive ? 'ok' : 'danger'}`}>
                  {profile?.isActive ? 'Active' : 'Disabled'}
                </span>
              </span>
            </div>
            <div className="rpt-insight">
              <span className="rpt-insight__label">Member Since</span>
              <span className="rpt-insight__value">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '\u2014'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
