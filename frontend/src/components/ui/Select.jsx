export default function Select({ label, value, onChange, options, placeholder, error, className = '' }) {
  const selectClass = `input-field__input${error ? ' input-field__input--error' : ''}`;
  return (
    <label className={`input-field ${className}`}>
      {label && <span className="input-field__label">{label}</span>}
      <select value={value} onChange={onChange} className={selectClass}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="input-field__error">{error}</span>}
    </label>
  );
}
