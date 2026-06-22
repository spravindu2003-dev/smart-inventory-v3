import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as productsApi from '../api/products';

const emptyForm = { name: '', sku: '', price: '', stock: '', category: '', description: '', expiryDate: '' };

export default function ProductsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'owner' || user?.role === 'manager';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [removalReason, setRemovalReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productsApi.getProducts();
      setProducts(data.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category || '',
      description: product.description || '',
      expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : '',
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10) || 0,
        expiryDate: form.expiryDate || null,
      };
      if (editing) {
        await productsApi.updateProduct(editing.id, payload);
      } else {
        await productsApi.createProduct(payload);
      }
      setModalOpen(false);
      await fetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function openDelete(product) {
    setDeleteTarget(product);
    setRemovalReason('');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (removalReason) {
        await productsApi.removeProduct(deleteTarget.id, removalReason);
      } else {
        await productsApi.deleteProduct(deleteTarget.id);
      }
      setDeleteTarget(null);
      await fetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  function set(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function isExpired(date) {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  if (loading) {
    return <div className="page-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Products</h2>
        {canWrite && (
          <button className="btn btn--primary" onClick={openCreate}>
            + Add Product
          </button>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Expiry</th>
              {canWrite && <th style={{ width: 100 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="table__empty">
                  No products yet
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id}>
                <td className="table__sku">{p.sku}</td>
                <td>{p.name}</td>
                <td>${Number(p.price).toFixed(2)}</td>
                <td>
                  <span className={`badge badge--${p.stock === 0 ? 'danger' : p.stock <= 10 ? 'warn' : 'ok'}`}>
                    {p.stock}
                  </span>
                </td>
                <td>{p.category || '\u2014'}</td>
                <td>
                  {p.expiryDate ? (
                    <span className={`badge badge--${isExpired(p.expiryDate) ? 'danger' : 'ok'}`}>
                      {isExpired(p.expiryDate) ? 'Expired' : new Date(p.expiryDate).toLocaleDateString()}
                    </span>
                  ) : '\u2014'}
                </td>
                {canWrite && (
                  <td>
                    <div className="table__actions">
                      <button className="btn btn--sm" onClick={() => openEdit(p)}>
                        Edit
                      </button>
                      <button
                        className="btn btn--sm btn--danger"
                        onClick={() => openDelete(p)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Add / Edit Modal --- */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal__body">
                <label>
                  SKU *
                  <input value={form.sku} onChange={set('sku')} required />
                </label>
                <label>
                  Name *
                  <input value={form.name} onChange={set('name')} required />
                </label>
                <div className="form-row">
                  <label>
                    Price *
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={set('price')}
                      required
                    />
                  </label>
                  <label>
                    Stock
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={set('stock')}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Category
                    <input value={form.category} onChange={set('category')} />
                  </label>
                  <label>
                    Expiry Date
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={set('expiryDate')}
                    />
                  </label>
                </div>
                <label>
                  Description
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={set('description')}
                  />
                </label>
              </div>
              <div className="modal__footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete / Remove Confirm --- */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Remove Product</h3>
              <button className="modal__close" onClick={() => setDeleteTarget(null)}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              <p>
                Remove <strong>{deleteTarget.name}</strong> from inventory?
              </p>
              <label>
                Reason (optional)
                <select value={removalReason} onChange={(e) => setRemovalReason(e.target.value)}>
                  <option value="">No reason</option>
                  <option value="expired">Expired</option>
                  <option value="damaged">Damaged</option>
                  <option value="low_demand">Low Demand</option>
                </select>
              </label>
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
