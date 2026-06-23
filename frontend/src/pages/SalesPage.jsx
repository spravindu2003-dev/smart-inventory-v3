import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getData, safeArray } from '../api/safeResponse';
import * as salesApi from '../api/sales';
import * as productsApi from '../api/products';
import { useFetch } from '../hooks/useFetch';
import { Events, emit } from '../utils/eventBus';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import Card from '../components/ui/Card';

export default function SalesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'owner' || user?.role === 'manager';

  const [sales, setSales] = useState([]);
  const { loading, error, run } = useFetch();

  const [createOpen, setCreateOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [saving, setSaving] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editCart, setEditCart] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editProductId, setEditProductId] = useState('');
  const [editQty, setEditQty] = useState(1);

  const [undoTarget, setUndoTarget] = useState(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    run(async (signal) => {
      const res = await salesApi.getSales(signal);
      setSales(getData(res));
    });
  }, [run]);

  async function openCreate() {
    setSelectedProductId('');
    setSelectedQty(1);
    setCart([]);
    setCreateOpen(true);
    try {
      const res = await productsApi.getProducts();
      setProducts(getData(res));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load products');
    }
  }

  function closeCreate() {
    setCreateOpen(false);
    setCart([]);
    setSelectedProductId('');
    setSelectedQty(1);
  }

  function handleAddToCart() {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    const product = products.find((p) => p.id === parseInt(selectedProductId, 10));
    if (!product) {
      toast.error('Selected product not found');
      return;
    }
    const qty = parseInt(selectedQty, 10);
    if (!qty || qty < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    const existing = cart.find((c) => c.productId === product.id);
    if (existing) {
      toast.error('Product already in cart');
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        availableStock: product.stock,
        price: Number(product.price),
      },
    ]);
    setSelectedProductId('');
    setSelectedQty(1);
  }

  function handleRemoveFromCart(index) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateSale() {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add at least one product.');
      return;
    }
    setSaving(true);
    try {
      const items = cart.map((c) => ({ productId: c.productId, quantity: c.quantity }));
      await salesApi.createSale(items);
      toast.success('Sale created successfully!');
      closeCreate();
      emit(Events.SALE_UPDATED);
      const fetchRes = await salesApi.getSales();
      setSales(getData(fetchRes));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create sale';
      const details = err.response?.data?.errors;
      if (details && Array.isArray(details)) {
        toast.error(`${msg}: ${details.join('; ')}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  // --- Edit ---

  async function openEdit(sale) {
    setEditTarget(sale);
    setEditCart(sale.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      price: Number(item.product.price),
      saleItemId: item.id,
    })));
    setEditProductId('');
    setEditQty(1);
    try {
      const res = await productsApi.getProducts();
      setProducts(getData(res));
    } catch (err) {
      toast.error('Failed to load products');
    }
  }

  function closeEdit() {
    setEditTarget(null);
    setEditCart([]);
  }

  function handleEditCartQty(index, qty) {
    setEditCart((prev) => prev.map((item, i) =>
      i === index ? { ...item, quantity: parseInt(qty, 10) || 1 } : item
    ));
  }

  function handleRemoveEditItem(index) {
    setEditCart((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddEditItem() {
    if (!editProductId) {
      toast.error('Please select a product');
      return;
    }
    const product = products.find((p) => p.id === parseInt(editProductId, 10));
    if (!product) {
      toast.error('Selected product not found');
      return;
    }
    const qty = parseInt(editQty, 10);
    if (!qty || qty < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    const existing = editCart.find((c) => c.productId === product.id);
    if (existing) {
      toast.error('Product already in cart');
      return;
    }
    setEditCart((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        price: Number(product.price),
      },
    ]);
    setEditProductId('');
    setEditQty(1);
  }

  async function handleSaveEdit() {
    if (editCart.length === 0) {
      toast.error('Sale must have at least one item');
      return;
    }
    setEditSaving(true);
    try {
      const items = editCart.map((c) => ({ productId: c.productId, quantity: c.quantity }));
      await salesApi.updateSale(editTarget.id, items);
      toast.success('Sale updated');
      closeEdit();
      emit(Events.SALE_UPDATED);
      const res = await salesApi.getSales();
      setSales(getData(res));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update sale';
      const details = err.response?.data?.errors;
      if (details && Array.isArray(details)) {
        toast.error(`${msg}: ${details.join('; ')}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setEditSaving(false);
    }
  }

  const editTotal = editCart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  // --- Undo ---

  async function handleUndo() {
    if (!undoTarget) return;
    setUndoing(true);
    try {
      await salesApi.undoSale(undoTarget.id);
      toast.success('Sale undone and stock restored');
      setUndoTarget(null);
      emit(Events.SALE_UPDATED);
      emit(Events.DASHBOARD_REFRESH);
      const res = await salesApi.getSales();
      setSales(getData(res));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to undo sale');
    } finally {
      setUndoing(false);
    }
  }

  // --- Render ---

  if (loading && sales.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">Sales</h2>
        </div>
        <div className="table-card">
          <div style={{ padding: '1rem' }}>
            <Skeleton width="100%" height={20} count={5} />
          </div>
        </div>
      </div>
    );
  }

  const productOptions = safeArray(products).map((p) => ({
    value: String(p.id),
    label: `${p.name} ($${Number(p.price).toFixed(2)}, stock: ${p.stock})`,
  }));

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Sales</h2>
        <Button onClick={openCreate}>+ Create Sale</Button>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>User</th>
              <th>Items</th>
              <th>Total</th>
              {canManage && <th style={{ width: 120 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {safeArray(sales).length === 0 && (
              <tr>
                <td colSpan={canManage ? 6 : 5}>
                  <EmptyState message="No sales yet" />
                </td>
              </tr>
            )}
            {safeArray(sales).map((sale) => (
              <tr key={sale.id}>
                <td><strong>#{sale.id}</strong></td>
                <td className="table__date">
                  {new Date(sale.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td>{sale.user?.username || '\u2014'}</td>
                <td>{sale.items?.length || 0}</td>
                <td>${Number(sale.total).toFixed(2)}</td>
                {canManage && (
                  <td>
                    <div className="table__actions">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(sale)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => setUndoTarget(sale)}>Undo</Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {safeArray(sales).map((sale) => sale.items?.length > 0 && (
        <Card key={`items-${sale.id}`} padding={false} className="sale-items">
          <div className="sale-items__header">
            Items for Sale #{sale.id}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product?.name || '\u2014'}</td>
                  <td className="table__sku">{item.product?.sku || '\u2014'}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.unitPrice).toFixed(2)}</td>
                  <td>${(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      {/* Create Sale Modal */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create Sale"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>Cancel</Button>
            <Button loading={saving} onClick={handleCreateSale}>
              {saving ? 'Creating...' : 'Complete Sale'}
            </Button>
          </>
        }
      >
        <div className="form-row">
          <Select
            label="Product"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            options={productOptions}
            placeholder="-- Select --"
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={selectedQty}
            onChange={(e) => setSelectedQty(e.target.value)}
          />
        </div>
        <Button onClick={handleAddToCart} size="sm" style={{ alignSelf: 'flex-start' }}>
          Add to Cart
        </Button>

        {cart.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <strong style={{ fontSize: '0.8125rem' }}>Cart ({cart.length} item{cart.length > 1 ? 's' : ''})</strong>
            <div className="table-card" style={{ marginTop: '0.5rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((c, i) => (
                    <tr key={i}>
                      <td>{c.productName}</td>
                      <td>{c.quantity}</td>
                      <td>${c.price.toFixed(2)}</td>
                      <td>${(c.price * c.quantity).toFixed(2)}</td>
                      <td>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveFromCart(i)}>
                          &times;
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, textAlign: 'right', marginTop: '0.5rem' }}>
              Total: ${cartTotal.toFixed(2)}
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Sale Modal */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title={`Edit Sale #${editTarget?.id}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeEdit}>Cancel</Button>
            <Button loading={editSaving} onClick={handleSaveEdit}>
              {editSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="form-row">
          <Select
            label="Add Product"
            value={editProductId}
            onChange={(e) => setEditProductId(e.target.value)}
            options={productOptions}
            placeholder="-- Select --"
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
          />
        </div>
        <Button onClick={handleAddEditItem} size="sm" style={{ alignSelf: 'flex-start' }}>
          Add to Cart
        </Button>

        {editCart.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <strong style={{ fontSize: '0.8125rem' }}>Items ({editCart.length})</strong>
            <div className="table-card" style={{ marginTop: '0.5rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {editCart.map((c, i) => (
                    <tr key={i}>
                      <td>{c.productName}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={c.quantity}
                          onChange={(e) => handleEditCartQty(i, e.target.value)}
                          style={{ width: 60, padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem' }}
                        />
                      </td>
                      <td>${c.price.toFixed(2)}</td>
                      <td>${(c.price * c.quantity).toFixed(2)}</td>
                      <td>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveEditItem(i)}>
                          &times;
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, textAlign: 'right', marginTop: '0.5rem' }}>
              Total: ${editTotal.toFixed(2)}
            </p>
          </div>
        )}
      </Modal>

      {/* Undo Confirm Modal */}
      <Modal
        open={!!undoTarget}
        onClose={() => setUndoTarget(null)}
        title="Undo Sale"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUndoTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={undoing} onClick={handleUndo}>
              {undoing ? 'Undoing...' : 'Confirm Undo'}
            </Button>
          </>
        }
      >
        <div className="confirm-modal">
          <p>Undo sale <strong>#{undoTarget?.id}</strong>?</p>
          <p className="confirm-modal__detail">
            This will restore all items back to inventory and remove the sale record. This action cannot be reversed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
