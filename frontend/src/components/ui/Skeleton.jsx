export default function Skeleton({ width, height = 20, borderRadius = 6, count = 1, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  ));

  if (count === 1) return items[0];
  return <div className="skeleton-group">{items}</div>;
}
