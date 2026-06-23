export default function Input({ label, type = 'text', value, onChange, placeholder, required, min, step, minLength, error, className = '', ...rest }) {
  const inputClass = `input-field__input${error ? ' input-field__input--error' : ''}`;
  return (
    <label className={`input-field ${className}`}>
      {label && <span className="input-field__label">{label}{required && ' *'}</span>}
      {type === 'textarea' ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} required={required} rows={rest.rows || 3} className={inputClass} />
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} min={min} step={step} minLength={minLength} className={inputClass} {...rest} />
      )}
      {error && <span className="input-field__error">{error}</span>}
    </label>
  );
}
