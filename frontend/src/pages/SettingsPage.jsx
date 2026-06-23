import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { getMyProfile, updateMyProfile } from '../api/users';
import { changePassword } from '../api/auth';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

export default function SettingsPage() {
  const { user } = useAuth();
  const { loading, run } = useFetch();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

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
    try {
      const res = await updateMyProfile({
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        email: form.email,
      });
      setProfile(res.data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwSaving(false);
    }
  }

  function setField(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  if (loading && !profile) {
    return (
      <div>
        <h2 className="page-title">Settings</h2>
        <Card>
          <Skeleton width="180px" height={20} />
          <div style={{ marginTop: 12 }}><Skeleton width="100%" height={40} count={3} /></div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Settings</h2>

      <div className="rpt-grid" style={{ maxWidth: 720 }}>
        <Card className="rpt-card--wide">
          <h3 className="rpt-card__title">Profile Information</h3>
          <form onSubmit={handleProfileSave}>
            <div className="form-row">
              <Input label="First Name" value={form.firstName} onChange={setField('firstName')} />
              <Input label="Last Name" value={form.lastName} onChange={setField('lastName')} />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={setField('email')} required />
            <div style={{ marginTop: '1rem' }}>
              <Button type="submit" loading={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="rpt-card--wide">
          <h3 className="rpt-card__title">Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <Input
              label="Current Password"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              required
            />
            <div className="form-row">
              <Input
                label="New Password"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                required
                minLength={6}
              />
              <Input
                label="Confirm Password"
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Button type="submit" loading={pwSaving}>
                {pwSaving ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="rpt-card--wide">
          <h3 className="rpt-card__title">Account Details</h3>
          <div className="rpt-insights">
            <div className="rpt-insight">
              <span className="rpt-insight__label">Username</span>
              <span className="rpt-insight__value">{user?.username}</span>
            </div>
            <div className="rpt-insight">
              <span className="rpt-insight__label">Role</span>
              <span className="rpt-insight__value">
                <Badge variant="role">{user?.role}</Badge>
              </span>
            </div>
            <div className="rpt-insight">
              <span className="rpt-insight__label">Status</span>
              <span className="rpt-insight__value">
                <Badge variant={profile?.isActive ? 'ok' : 'danger'}>
                  {profile?.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </span>
            </div>
            <div className="rpt-insight">
              <span className="rpt-insight__label">Member Since</span>
              <span className="rpt-insight__value">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '\u2014'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
