import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useOnboarding } from '../context/OnboardingContext';
import { createProduct } from '../api/products';
import { createSale } from '../api/sales';
import { getProducts } from '../api/products';
import { useFetch } from '../hooks/useFetch';

const steps = [
  { num: 1, label: 'Welcome' },
  { num: 2, label: 'Business' },
  { num: 3, label: 'Product' },
  { num: 4, label: 'Sale' },
  { num: 5, label: 'Tour' },
];

const categoryOptions = [
  'Retail',
  'Wholesale',
  'Food & Beverage',
  'Electronics',
  'Clothing',
  'Pharmaceutical',
  'Automotive',
  'Other',
];

function WelcomeStep({ onStart }) {
  return (
    <div className="onboard-step">
      <div className="onboard-icon">&#9733;</div>
      <h2 className="onboard-step__title">Welcome to Smart Inventory</h2>
      <p className="onboard-step__desc">
        Let&rsquo;s get your inventory management system set up in just a few steps.
        You&rsquo;ll create your first product, process your first sale, and learn your way around the dashboard.
      </p>
      <ul className="onboard-checklist">
        <li>&#10003; Set up your business</li>
        <li>&#10003; Add your first product</li>
        <li>&#10003; Process your first sale</li>
        <li>&#10003; Take a quick dashboard tour</li>
      </ul>
      <button className="btn btn--primary btn--lg onboard-cta" onClick={onStart}>
        Let&rsquo;s Get Started
      </button>
    </div>
  );
}

function BusinessStep({ businessName, businessCategory, onSave }) {
  const [name, setName] = useState(businessName || '');
  const [category, setCategory] = useState(businessCategory || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a business name');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    setError('');
    onSave(name.trim(), category);
  };

  return (
    <div className="onboard-step">
      <div className="onboard-icon">&#9881;</div>
      <h2 className="onboard-step__title">Business Setup</h2>
      <p className="onboard-step__desc">Tell us a bit about your business so we can tailor the experience.</p>

      <div className="onboard-form">
        <div className="input-field">
          <label className="input-field__label">Business Name</label>
          <input
            className="input-field__input"
            type="text"
            placeholder="e.g. My Store"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="input-field">
          <label className="input-field__label">Category</label>
          <select
            className="input-field__input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {error && <p className="onboard-error">{error}</p>}
      </div>

      <button className="btn btn--primary btn--lg onboard-cta" onClick={handleSave}>
        Save &amp; Continue
      </button>
    </div>
  );
}

function ProductStep({ onComplete, onSkip }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [sku, setSku] = useState('');
  const [error, setError] = useState('');
  const { loading, run } = useFetch();

  const handleCreate = () => {
    if (!name.trim()) { setError('Product name is required'); return; }
    if (!price || Number(price) <= 0) { setError('Enter a valid price'); return; }
    if (!stock || Number(stock) < 0) { setError('Enter a valid stock quantity'); return; }
    setError('');

    run(async (signal) => {
      await createProduct({
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        sku: sku.trim() || undefined,
      }, signal);
      toast.success(`Product &ldquo;${name.trim()}&rdquo; created!`);
      onComplete();
    }).catch((err) => {
      setError(err.response?.data?.message || err.message || 'Failed to create product');
    });
  };

  return (
    <div className="onboard-step">
      <div className="onboard-icon">&#9632;</div>
      <h2 className="onboard-step__title">Create Your First Product</h2>
      <p className="onboard-step__desc">Add a product to your inventory. You can always add more later.</p>

      <div className="onboard-form">
        <div className="input-field">
          <label className="input-field__label">Product Name</label>
          <input className="input-field__input" type="text" placeholder="e.g. Coffee Mug" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div className="input-field">
          <label className="input-field__label">Price ($)</label>
          <input className="input-field__input" type="number" step="0.01" min="0" placeholder="9.99" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>

        <div className="input-field">
          <label className="input-field__label">Stock Quantity</label>
          <input className="input-field__input" type="number" min="0" placeholder="10" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>

        <div className="input-field">
          <label className="input-field__label">SKU (optional)</label>
          <input className="input-field__input" type="text" placeholder="e.g. MUG-001" value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>

        {error && <p className="onboard-error">{error}</p>}
      </div>

      <div className="onboard-actions">
        <button className="btn btn--ghost" onClick={onSkip}>Skip this step</button>
        <button className="btn btn--primary btn--lg" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </div>
    </div>
  );
}

function SaleStep({ onComplete, onSkip }) {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const { loading, run } = useFetch();
  const [productsLoading, setProductsLoading] = useState(true);

  useState(() => {
    getProducts()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.products) ? res.data.products : [];
        setProducts(list);
        if (list.length > 0) setSelectedId(String(list[0].id));
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  const handleCreateSale = () => {
    if (!selectedId) { setError('Please select a product'); return; }
    if (!quantity || Number(quantity) <= 0) { setError('Enter a valid quantity'); return; }
    setError('');

    run(async (signal) => {
      await createSale([{ productId: Number(selectedId), quantity: Number(quantity) }], signal);
      toast.success('First sale completed!');
      onComplete();
    }).catch((err) => {
      setError(err.response?.data?.message || err.message || 'Failed to create sale');
    });
  };

  return (
    <div className="onboard-step">
      <div className="onboard-icon">&#9741;</div>
      <h2 className="onboard-step__title">Process Your First Sale</h2>
      <p className="onboard-step__desc">
        Simulate a sale by selecting a product and quantity. This creates a real transaction in your system.
      </p>

      <div className="onboard-form">
        <div className="input-field">
          <label className="input-field__label">Product</label>
          {productsLoading ? (
            <div className="skeleton" style={{ height: 38 }} />
          ) : (
            <select className="input-field__input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (${Number(p.price).toFixed(2)})</option>
              ))}
            </select>
          )}
        </div>

        <div className="input-field">
          <label className="input-field__label">Quantity</label>
          <input className="input-field__input" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>

        {error && <p className="onboard-error">{error}</p>}
      </div>

      <div className="onboard-actions">
        <button className="btn btn--ghost" onClick={onSkip}>Skip this step</button>
        <button className="btn btn--primary btn--lg" onClick={handleCreateSale} disabled={loading}>
          {loading ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </div>
  );
}

function TourStep({ onComplete }) {
  return (
    <div className="onboard-step">
      <div className="onboard-icon">&#9733;</div>
      <h2 className="onboard-step__title">You&rsquo;re All Set!</h2>
      <p className="onboard-step__desc">
        Your inventory system is ready to go. Take a quick tour of the dashboard to learn about your key tools.
      </p>

      <div className="onboard-summary">
        <div className="onboard-summary__item">
          <span className="onboard-summary__check">&#10003;</span>
          <span>Business configured</span>
        </div>
        <div className="onboard-summary__item">
          <span className="onboard-summary__check">&#10003;</span>
          <span>First product created</span>
        </div>
        <div className="onboard-summary__item">
          <span className="onboard-summary__check">&#10003;</span>
          <span>First sale processed</span>
        </div>
      </div>

      <button className="btn btn--primary btn--lg onboard-cta" onClick={onComplete}>
        Start Dashboard Tour
      </button>
    </div>
  );
}

export default function OnboardingWizard() {
  const {
    status,
    currentStep,
    businessName,
    businessCategory,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    setBusinessInfo,
    markProductCreated,
    markSaleCompleted,
    completeTour,
  } = useOnboarding();

  const navigate = useNavigate();

  if (status !== 'in_progress') return null;

  const handleStart = () => {
    startOnboarding();
  };

  const handleBusinessSave = (name, category) => {
    setBusinessInfo(name, category);
    nextStep();
  };

  const handleProductComplete = () => {
    markProductCreated();
    nextStep();
  };

  const handleSaleComplete = () => {
    markSaleCompleted();
    nextStep();
  };

  const handleTourEnd = () => {
    completeTour();
    navigate('/dashboard');
  };

  const handleSkip = () => {
    skipOnboarding();
    toast('Onboarding skipped. You can resume from Settings.', { icon: '\u2139\uFE0F' });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onStart={handleStart} />;
      case 2:
        return (
          <BusinessStep
            businessName={businessName}
            businessCategory={businessCategory}
            onSave={handleBusinessSave}
          />
        );
      case 3:
        return <ProductStep onComplete={handleProductComplete} onSkip={nextStep} />;
      case 4:
        return <SaleStep onComplete={handleSaleComplete} onSkip={nextStep} />;
      case 5:
        return <TourStep onComplete={handleTourEnd} />;
      default:
        return null;
    }
  };

  return (
    <div className="onboard-overlay">
      <div className="onboard-container">
        <div className="onboard-progress">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`onboard-progress__step${s.num === currentStep ? ' onboard-progress__step--active' : ''}${s.num < currentStep ? ' onboard-progress__step--done' : ''}`}
            >
              <span className="onboard-progress__dot">{s.num < currentStep ? '\u2713' : s.num}</span>
              <span className="onboard-progress__label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="onboard-body">
          {renderStep()}
        </div>

        <div className="onboard-footer">
          {currentStep > 1 && currentStep < 5 && (
            <button className="btn btn--ghost btn--sm" onClick={prevStep}>
              &larr; Back
            </button>
          )}
          <div className="onboard-footer__spacer" />
          {currentStep < 5 && (
            <button className="btn btn--ghost btn--sm" onClick={handleSkip}>
              Skip Onboarding
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
