export default function Select({ label, value, onChange, options, placeholder, className = '' }) {
  return (
    <label className={`input-field ${className}`}>
      {label && <span className="input-field__label">{label}</span>}
      <select value={value} onChange={onChange} className="input-field__input">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}
