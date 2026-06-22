import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getData } from '../api/responseHandler';
import * as salesApi from '../api/sales';
import * as productsApi from '../api/products';

export default function SalesPage() {
  const { user } = useAuth();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await salesApi.getSales();
      setSales(getData(data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  async function openModal() {
    clearMessages();
    setError('');
    setSelectedProductId('');
    setSelectedQty(1);
    setCart([]);
    setModalOpen(true);
    try {
      const data = await productsApi.getProducts();
      setProducts(getData(data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    }
  }

  function closeModal() {
    setModalOpen(false);
    setCart([]);
    setSelectedProductId('');
    setSelectedQty(1);
  }

  function handleAddToCart() {
    if (!selectedProductId) {
      setError('Please select a product');
      return;
    }
    const product = products.find((p) => p.id === parseInt(selectedProductId, 10));
    if (!product) {
      setError('Selected product not found');
      return;
    }
    const qty = parseInt(selectedQty, 10);
    if (!qty || qty < 1) {
      setError('Quantity must be at least 1');
      return;
    }
    const existing = cart.find((c) => c.productId === product.id);
    if (existing) {
      setError('Product already in cart');
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
    setError('');
  }

  function handleRemoveFromCart(index) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateSale() {
    if (cart.length === 0) {
      setError('Cart is empty. Add at least one product.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const items = cart.map((c) => ({ productId: c.productId, quantity: c.quantity }));
      const data = await salesApi.createSale(items);
      setSuccess(`Sale #${data.sale.id} created successfully!`);
      closeModal();
      await fetch();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create sale';
      const details = err.response?.data?.errors;
      if (details && Array.isArray(details)) {
        setError(`${msg}: ${details.join('; ')}`);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  if (loading) {
    return <div className="page-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Sales</h2>
        <button className="btn btn--primary" onClick={openModal}>
          + Create Sale
        </button>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="alert alert--success" style={{ marginBottom: '1rem' }}>{success}</div>}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>User</th>
              <th>Items</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan={5} className="table__empty">No sales yet</td>
              </tr>
            )}
            {sales.map((sale) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sales.map((sale) => sale.items?.length > 0 && (
        <div key={`items-${sale.id}`} className="sale-items">
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
        </div>
      ))}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal__header">
              <h3>Create Sale</h3>
              <button className="modal__close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal__body">
              <div className="form-row">
                <label>
                  Product
                  <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                    <option value="">-- Select --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${Number(p.price).toFixed(2)}, stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(e.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleAddToCart}
                style={{ alignSelf: 'flex-start' }}
              >
                Add to Cart
              </button>

              {cart.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong style={{ fontSize: '0.8125rem' }}>Cart ({cart.length} item{cart.length > 1 ? 's' : ''})</strong>
                  <div className="table-wrapper" style={{ marginTop: '0.5rem' }}>
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
                              <button
                                className="btn btn--sm btn--danger"
                                onClick={() => handleRemoveFromCart(i)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '0.5rem', fontWeight: 700 }}>
                    Total: ${cartTotal.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button type="button" className="btn" onClick={closeModal}>Cancel</button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={saving || cart.length === 0}
                onClick={handleCreateSale}
              >
                {saving ? 'Creating...' : 'Create Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
