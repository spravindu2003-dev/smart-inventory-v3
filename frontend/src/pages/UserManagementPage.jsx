import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getData, safeArray } from '../api/safeResponse';
import { useFetch } from '../hooks/useFetch';
import * as usersApi from '../api/users';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const emptyForm = { username: '', email: '', password: '', firstName: '', lastName: '', role: 'cashier' };

const roleOptions = [
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
];

const editRoleOptions = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const { loading, run } = useFetch();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    run(async (signal) => {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await usersApi.getUsers(params, signal);
      setUsers(getData(res));
      setPagination(res.data.pagination);
    });
  }, [run, page, search, roleFilter]);

  function handleSearch(val) {
    setSearch(val);
    setPage(1);
  }

  function handleRoleFilter(val) {
    setRoleFilter(val);
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      username: user.username,
      password: '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await usersApi.updateUser(editing.id, {
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          email: form.email,
          role: form.role,
        });
        toast.success('User updated');
      } else {
        await usersApi.createUser({
          username: form.username,
          email: form.email,
          password: form.password,
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          role: form.role,
        });
        toast.success('User created');
      }
      closeModal();
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user) {
    const action = user.isActive ? 'deactivate' : 'activate';
    try {
      await usersApi.toggleUserStatus(user.id);
      toast.success(`User ${action}d`);
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} user`);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.deleteUser(deleteTarget.id);
      toast.success('User deleted');
      setDeleteTarget(null);
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  function setField(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  if (loading && users.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">User Management</h2>
        </div>
        <div className="table-card">
          <div style={{ padding: '1rem' }}>
            <Skeleton width="100%" height={20} count={6} />
          </div>
        </div>
      </div>
    );
  }

  const filterRoleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'owner', label: 'Owner' },
    { value: 'manager', label: 'Manager' },
    { value: 'cashier', label: 'Cashier' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">User Management</h2>
        <Button onClick={openCreate}>+ Add User</Button>
      </div>

      <div className="filters-bar">
        <input
          className="filters-bar__input"
          type="text"
          placeholder="Search username or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Select
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          options={filterRoleOptions}
        />
      </div>

      <div className="table-card" style={{ marginTop: '0.75rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeArray(users).length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState message="No users found" />
                </td>
              </tr>
            )}
            {safeArray(users).map((u) => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td>{u.email}</td>
                <td>{(u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '\u2014'}</td>
                <td><Badge variant="role">{u.role}</Badge></td>
                <td>
                  <Badge variant={u.isActive ? 'ok' : 'danger'}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </td>
                <td>
                  <div className="table__actions">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>Edit</Button>
                    <Button size="sm" variant={u.isActive ? 'danger' : 'ghost'} onClick={() => handleToggleStatus(u)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(u)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <Button
            size="sm"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="pagination__info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit User' : 'Add User'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" form="user-form" loading={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSave}>
          {!editing && (
            <>
              <Input label="Username" value={form.username} onChange={setField('username')} required />
              <Input label="Password" type="password" value={form.password} onChange={setField('password')} required />
            </>
          )}
          <Input label="Email" type="email" value={form.email} onChange={setField('email')} required />
          <div className="form-row">
            <Input label="First Name" value={form.firstName} onChange={setField('firstName')} />
            <Input label="Last Name" value={form.lastName} onChange={setField('lastName')} />
          </div>
          {!editing && (
            <Select label="Role" value={form.role} onChange={setField('role')} options={roleOptions} />
          )}
          {editing && (
            <Select label="Role" value={form.role} onChange={setField('role')} options={editRoleOptions} />
          )}
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete User"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <div className="confirm-modal">
          <p>Delete user <strong>{deleteTarget?.username}</strong>?</p>
          <p className="confirm-modal__detail">
            This will soft-delete the account. The user will no longer be able to log in.
          </p>
        </div>
      </Modal>
    </div>
  );
}
