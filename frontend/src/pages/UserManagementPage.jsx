import { useState, useEffect, useCallback } from 'react';
import { getData, safeArray } from '../api/safeResponse';
import { useFetch } from '../hooks/useFetch';
import * as usersApi from '../api/users';

const emptyForm = { username: '', email: '', password: '', firstName: '', lastName: '', role: 'cashier' };

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
  const [saveError, setSaveError] = useState('');

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
    setSaveError('');
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
    setSaveError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setSaveError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editing) {
        await usersApi.updateUser(editing.id, {
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          email: form.email,
          role: form.role,
        });
      } else {
        await usersApi.createUser({
          username: form.username,
          email: form.email,
          password: form.password,
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          role: form.role,
        });
      }
      closeModal();
      setPage(1);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user) {
    try {
      await usersApi.toggleUserStatus(user.id);
      setPage(1);
    } catch (err) {
      /* silent */
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      setPage(1);
    } catch (err) {
      /* silent */
    } finally {
      setDeleting(false);
    }
  }

  function setField(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  if (loading && users.length === 0) {
    return <div className="page-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">User Management</h2>
        <button className="btn btn--primary" onClick={openCreate}>
          + Add User
        </button>
      </div>

      <div className="filters-bar">
        <input
          className="filters-bar__input"
          type="text"
          placeholder="Search username or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className="filters-bar__select"
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
        </select>
      </div>

      <div className="table-wrapper" style={{ marginTop: '0.75rem' }}>
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
                <td colSpan={6} className="table__empty">No users found</td>
              </tr>
            )}
            {safeArray(users).map((u) => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td>{u.email}</td>
                <td>{(u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '\u2014'}</td>
                <td><span className="badge badge--role">{u.role}</span></td>
                <td>
                  <span className={`badge badge--${u.isActive ? 'ok' : 'danger'}`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div className="table__actions">
                    <button className="btn btn--sm" onClick={() => openEdit(u)}>
                      Edit
                    </button>
                    <button
                      className={`btn btn--sm ${u.isActive ? 'btn--danger' : ''}`}
                      onClick={() => handleToggleStatus(u)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn btn--sm btn--danger"
                      onClick={() => setDeleteTarget(u)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn--sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="pagination__info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="btn btn--sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editing ? 'Edit User' : 'Add User'}</h3>
              <button className="modal__close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal__body">
                {saveError && <div className="alert alert--error" style={{ marginBottom: '0.75rem' }}>{saveError}</div>}
                {!editing && (
                  <>
                    <label>
                      Username *
                      <input value={form.username} onChange={setField('username')} required />
                    </label>
                    <label>
                      Password *
                      <input type="password" value={form.password} onChange={setField('password')} required />
                    </label>
                  </>
                )}
                <label>
                  Email *
                  <input type="email" value={form.email} onChange={setField('email')} required />
                </label>
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
                {!editing && (
                  <label>
                    Role *
                    <select value={form.role} onChange={setField('role')}>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </label>
                )}
                {editing && (
                  <label>
                    Role
                    <select value={form.role} onChange={setField('role')}>
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </label>
                )}
              </div>
              <div className="modal__footer">
                <button type="button" className="btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Delete User</h3>
              <button className="modal__close" onClick={() => setDeleteTarget(null)}>&times;</button>
            </div>
            <div className="modal__body">
              <p>Delete user <strong>{deleteTarget.username}</strong>?</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                This will soft-delete the account. The user will no longer be able to log in.
              </p>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn btn--danger" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
