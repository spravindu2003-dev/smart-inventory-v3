export default function Input({ label, type = 'text', value, onChange, placeholder, required, min, step, minLength, className = '', ...rest }) {
  return (
    <label className={`input-field ${className}`}>
      {label && <span className="input-field__label">{label}{required && ' *'}</span>}
      {type === 'textarea' ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} required={required} rows={rest.rows || 3} className="input-field__input" />
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} min={min} step={step} minLength={minLength} className="input-field__input" {...rest} />
      )}
    </label>
  );
}
