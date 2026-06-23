export default function Button({ children, variant = 'primary', size = 'md', disabled, loading, type = 'button', className = '', onClick }) {
  const cls = [
    'btn',
    variant === 'primary' ? 'btn--primary' : variant === 'danger' ? 'btn--danger' : variant === 'ghost' ? 'btn--ghost' : '',
    size === 'sm' ? 'btn--sm' : size === 'lg' ? 'btn--lg' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={cls} disabled={disabled || loading} onClick={onClick}>
      {loading ? <span className="btn__spinner" /> : children}
    </button>
  );
}
