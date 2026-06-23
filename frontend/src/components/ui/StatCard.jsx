export default function StatCard({ value, label, variant = 'default', className = '' }) {
  return (
    <div className={`stat-card stat-card--${variant} ${className}`}>
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  );
}
