import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getData, safeArray } from '../api/safeResponse';
import * as productsApi from '../api/products';
import { useFetch } from '../hooks/useFetch';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const emptyForm = { name: '', sku: '', price: '', stock: '', category: '', description: '', expiryDate: '' };

const removalOptions = [
  { value: '', label: 'No reason' },
  { value: 'expired', label: 'Expired' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'low_demand', label: 'Low Demand' },
];

export default function ProductsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'owner' || user?.role === 'manager';

  const [products, setProducts] = useState([]);
  const { loading, run } = useFetch();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [removalReason, setRemovalReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    run(async (signal) => {
      const res = await productsApi.getProducts(signal);
      setProducts(getData(res));
    });
  }, [run]);

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
        toast.success('Product updated');
      } else {
        await productsApi.createProduct(payload);
        toast.success('Product created');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      const res = await productsApi.getProducts();
      setProducts(getData(res));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
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
      toast.success('Product removed');
      setDeleteTarget(null);
      const res = await productsApi.getProducts();
      setProducts(getData(res));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
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

  const stockBadgeVariant = (stock) => {
    if (stock === 0) return 'danger';
    if (stock <= 10) return 'warn';
    return 'ok';
  };

  const expiryBadgeVariant = (date) => {
    if (!date) return null;
    return isExpired(date) ? 'danger' : 'ok';
  };

  if (loading && products.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">Products</h2>
        </div>
        <div className="table-card">
          <div style={{ padding: '1rem' }}>
            <Skeleton width="100%" height={20} count={6} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Products</h2>
        {canWrite && (
          <Button onClick={openCreate}>+ Add Product</Button>
        )}
      </div>

      <div className="table-card">
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
            {safeArray(products).length === 0 && (
              <tr>
                <td colSpan={canWrite ? 7 : 6}>
                  <EmptyState message="No products yet" />
                </td>
              </tr>
            )}
            {safeArray(products).map((p) => (
              <tr key={p.id}>
                <td className="table__sku">{p.sku}</td>
                <td>{p.name}</td>
                <td>${Number(p.price).toFixed(2)}</td>
                <td>
                  <Badge variant={stockBadgeVariant(p.stock)}>{p.stock}</Badge>
                </td>
                <td>{p.category || '\u2014'}</td>
                <td>
                  {p.expiryDate ? (
                    <Badge variant={expiryBadgeVariant(p.expiryDate)}>
                      {isExpired(p.expiryDate) ? 'Expired' : new Date(p.expiryDate).toLocaleDateString()}
                    </Badge>
                  ) : '\u2014'}
                </td>
                {canWrite && (
                  <td>
                    <div className="table__actions">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => openDelete(p)}>Delete</Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); }}
        title={editing ? 'Edit Product' : 'Add Product'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); }}>Cancel</Button>
            <Button type="submit" form="product-form" loading={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSave}>
          <Input label="SKU" value={form.sku} onChange={set('sku')} required />
          <Input label="Name" value={form.name} onChange={set('name')} required />
          <div className="form-row">
            <Input label="Price" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required />
            <Input label="Stock" type="number" min="0" value={form.stock} onChange={set('stock')} />
          </div>
          <div className="form-row">
            <Input label="Category" value={form.category} onChange={set('category')} />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          </div>
          <Input label="Description" type="textarea" value={form.description} onChange={set('description')} rows={3} />
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Product"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              {deleting ? 'Removing...' : 'Remove'}
            </Button>
          </>
        }
      >
        <div className="confirm-modal">
          <p>Remove <strong>{deleteTarget?.name}</strong> from inventory?</p>
          <div style={{ marginTop: '0.75rem' }}>
            <Select
              label="Reason (optional)"
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
              options={removalOptions}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
